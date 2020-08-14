/**
 * @license
 * Copyright 2018-2020 Streamlit Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react"
import axios, { CancelTokenSource } from "axios"
import Dropzone, { FileRejection } from "react-dropzone"
import Icon from "components/shared/Icon"
import { Map as ImmutableMap } from "immutable"
import { FileUploadClient } from "lib/FileUploadClient"
import { ExtendedFile, getSizeDisplay } from "lib/FileHelper"
import { WidgetStateManager } from "lib/WidgetStateManager"
import { fileUploaderOverrides } from "lib/widgetTheme" // deprecate

import UIButton from "components/widgets/Button/UIButton"
import UploadedFiles from "./UploadedFiles"
import "./FileUploader.scss"

export interface Props {
  disabled: boolean
  element: ImmutableMap<string, any>
  widgetStateManager: WidgetStateManager
  uploadClient: FileUploadClient
  width: number
}

interface State {
  status: "READY" | "UPLOADING" | "UPLOADED" | "ERROR"
  errorMessage?: string
  files: ExtendedFile[]
  maxSizeBytes: number
}

class FileUploader extends React.PureComponent<Props, State> {
  private currentUploadCanceller?: CancelTokenSource
  public constructor(props: Props) {
    super(props)
    const maxMbs = props.element.get("maxUploadSizeMb")

    this.state = {
      status: "READY",
      errorMessage: undefined,
      files: [],
      maxSizeBytes: maxMbs * 1024 * 1024,
    }
  }

  public componentDidUpdate = (prevProps: Props): void => {
    // Widgets are disabled if the app is not connected anymore.
    // If the app disconnects from the server, a new session is created and users
    // will lose access to the files they uploaded in their previous session.
    // If we are reconnecting, reset the file uploader so that the widget is
    // in sync with the new session.
    if (prevProps.disabled !== this.props.disabled && this.props.disabled) {
      this.reset()
    }

    const currentMaxSize = this.props.element.get("maxUploadSizeMb")
    if (prevProps.element.get("maxUploadSizeMb") !== currentMaxSize) {
      this.setState({ maxSizeBytes: currentMaxSize * 1024 * 1024 })
    }
  }

  private handleFile = (file: ExtendedFile, index: number): void => {
    // Add an unique ID to each file for server and client to sync on
    file.id = `${index}${new Date().getTime()}`

    // Validate size
    const { element } = this.props
    file.cancelToken = axios.CancelToken.source()
    this.uploadFile(file)

    this.setState(state => ({ files: state.files.concat(file) }))
  }

  private uploadFile = (file: ExtendedFile): void => {
    this.props.uploadClient
      .uploadFiles(
        this.props.element.get("id"),
        [file],
        e => this.onUploadProgress(e, file),
        file.cancelToken
          ? file.cancelToken.token
          : axios.CancelToken.source().token
      )
      .then(() => {
        this.setState(state => {
          const files = state.files.map(existingFile => {
            if (file.id === existingFile.id) {
              delete file.progress
              delete file.cancelToken
              file.status = "UPLOADED"
              return file
            }
            return existingFile
          })
          return { files }
        })
      })
      .catch(err => {
        if (axios.isCancel(err)) {
          // If this was a cancel error, we don't show the user an error -
          // the cancellation was in response to an action they took
          const files = this.state.files.map(existingFile => {
            if (file.id === existingFile.id) {
              // status: "UPLOADED",
              return file
            }
            return existingFile
          })
          this.setState({ files })
        } else {
          this.setState({
            status: "ERROR",
            errorMessage: err ? err.toString() : "Unknown error",
          })
        }
      })
  }

  private dropHandler = (
    acceptedFiles: ExtendedFile[],
    rejectedFiles: FileRejection[]
  ): void => {
    const { element } = this.props
    const multipleFiles = element.get("multipleFiles")
    const uploadedFiles: ExtendedFile[] = []

    if (!multipleFiles && this.state.files.length) {
      // Only one file is allowed. Delete existing file.
      this.delete(null, this.state.files[0].id)
    }

    if (rejectedFiles.length > 1 && !multipleFiles) {
      const firstFile: FileRejection | undefined = rejectedFiles.shift()
      if (firstFile) {
        this.handleFile(firstFile.file, acceptedFiles.length)
      }
      rejectedFiles.forEach(rejectedFile =>
        uploadedFiles.push(
          Object.assign(rejectedFile.file, {
            status: "ERROR",
            errorMessage: this.getErrorMessage(
              rejectedFile.errors[0].code,
              rejectedFile.file
            ),
          })
        )
      )
    } else {
      rejectedFiles.forEach(rejectedFile =>
        uploadedFiles.push(
          Object.assign(rejectedFile.file, {
            status: "ERROR",
            errorMessage: this.getErrorMessage(
              rejectedFile.errors[0].code,
              rejectedFile.file
            ),
          })
        )
      )
    }

    if (uploadedFiles.length) {
      this.setState({
        files: this.state.files.concat(uploadedFiles),
      })
    }

    acceptedFiles.map(this.handleFile)
  }

  private getErrorMessage = (
    errorCode: string,
    file: ExtendedFile
  ): string => {
    switch (errorCode) {
      case "file-too-large":
        return `File must be ${getSizeDisplay(
          this.state.maxSizeBytes,
          "b"
        )} or smaller.`
      case "file-invalid-type":
        return `${file.type} files are not allowed.`
      case "file-too-small":
        // This should not fire.
        return `File size is too small.`
      case "too-many-files":
        return "Only one file is allowed."
      default:
        return "Unexpected error. Please try again."
    }
  }

  private delete = (
    event: React.SyntheticEvent<HTMLElement> | null,
    id?: string
  ): void => {
    const fileId = event ? event.currentTarget.id : id
    if (fileId && this.state.files.find(file => file.id === fileId)) {
      // File found, proceed to delete HTTP call.
    } else {
      const errorMessage = "File not found. Please try again."
      this.setState({
        status: "ERROR",
        errorMessage: errorMessage,
      })

      return
    }

    this.props.uploadClient
      .delete(this.props.element.get("id"), fileId)
      .then(() => {
        const filteredFiles = this.state.files.filter(
          file => file.id !== fileId
        )
        this.setState({
          status: filteredFiles.length ? "UPLOADED" : "READY",
          errorMessage: undefined,
          files: filteredFiles,
        })
      })
  }

  private reset = (): void => {
    this.setState({
      status: "READY",
      errorMessage: undefined,
      files: [],
    })
  }

  private onUploadProgress = (
    progressEvent: ProgressEvent,
    file: ExtendedFile
  ): void => {
    file.progress = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    )

    this.setState(state => {
      const files = state.files.map(uploadingFile =>
        uploadingFile.id === file.id ? file : uploadingFile
      )

      return { files }
    })
  }

  private cancelCurrentUpload = (): void => {
    if (this.currentUploadCanceller != null) {
      this.currentUploadCanceller.cancel()
      this.currentUploadCanceller = undefined
    }
  }

  public render = (): React.ReactNode => {
    const { status, errorMessage, files } = this.state
    const { element } = this.props
    const label: string = element.get("label")
    const multipleFiles: boolean = element.get("multipleFiles")
    const accept: string[] = element
      .get("type")
      .toArray()
      .map((value: string) => `.${value}`)

    return (
      <div className="Widget stFileUploader">
        <label>{label}</label>
        {multipleFiles || files.length === 0 ? (
          <Dropzone
            onDrop={this.dropHandler}
            multiple={multipleFiles}
            accept={accept.length === 0 ? undefined : accept}
            maxSize={this.state.maxSizeBytes}
            disabled={this.props.disabled}
          >
            {({ getRootProps, getInputProps }) => (
              <section {...getRootProps()} className="fileUploadDropzone">
                <input {...getInputProps()} />
                <div className="mr-auto d-none d-md-flex align-items-center">
                  <Icon
                    className="icon fileUploaderIcon icon-md"
                    type="cloud-upload"
                  />{" "}
                  <div className="d-flex flex-column">
                    <span>
                      Drag and drop file{multipleFiles ? "s" : ""} here
                    </span>
                    <small>
                      {getSizeDisplay(this.state.maxSizeBytes, "b", 0)}
                      {accept.length
                        ? ` • ${accept
                            .join(", ")
                            .replace(".", "")
                            .toUpperCase()}`
                        : null}
                    </small>
                  </div>
                </div>
                <UIButton label="Browse files" />
              </section>
            )}
          </Dropzone>
        ) : null}
        <div className="uploadedFiles row p-3">
          <UploadedFiles
            items={files}
            pageSize={4}
            itemType="files"
            onDelete={this.delete}
          />
        </div>
      </div>
    )
  }
}

export default FileUploader
