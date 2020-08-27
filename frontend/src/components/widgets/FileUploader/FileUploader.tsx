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
import { Map as ImmutableMap } from "immutable"
import MimeTypes from "mime-types"

import { ExtendedFile, FileStatuses, getSizeDisplay } from "lib/FileHelper"
import { FileUploadClient } from "lib/FileUploadClient"
import { WidgetStateManager } from "lib/WidgetStateManager"

import UIButton from "components/widgets/Button/UIButton"
import UploadedFiles from "./UploadedFiles"
import FileUploaderInstructions from "./FileUploaderInstructions"
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
    this.setState(state => {
      state.files.unshift(file)
      return {
        files: [...state.files],
      }
    })
  }

  private uploadFile = (file: ExtendedFile, index: number): void => {
    file.progress = 1
    this.handleFile(file, index)
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

  private rejectFiles = (rejectedFiles: FileRejection[]) => {
    rejectedFiles.forEach((rejectedFile, index) => {
      Object.assign(rejectedFile.file, {
        status: "ERROR",
        errorMessage: this.getErrorMessage(
          rejectedFile.errors[0].code,
          rejectedFile.file
        ),
      })
      this.handleFile(rejectedFile.file, index)
    })
  }

  private dropHandler = (
    acceptedFiles: ExtendedFile[],
    rejectedFiles: FileRejection[]
  ): void => {
    const { element } = this.props
    const multipleFiles = element.get("multipleFiles")

    if (!multipleFiles && this.state.files.length) {
      // Only one file is allowed. Delete existing file.
      this.delete(null, this.state.files[0].id)
    }

    if (rejectedFiles.length > 1 && !multipleFiles) {
      const firstFile: FileRejection | undefined = rejectedFiles.shift()
      if (firstFile) {
        this.uploadFile(firstFile.file, acceptedFiles.length)
      }
      this.rejectFiles(rejectedFiles)
    } else {
      this.rejectFiles(rejectedFiles)
    }

    acceptedFiles.map(this.uploadFile)
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
    const file = this.state.files.find(file => file.id === fileId)
    if (fileId && file) {
      file.status = FileStatuses.DELETING
      this.setState({ files: [...this.state.files] })
      if (file.errorMessage) {
        // If file had an error message, it was not uploaded.
        // No need to make a HTTP call.
        this.removeFile(fileId)
        return
      }
    } else {
      const errorMessage = "File not found. Please try again."
      this.setState({
        status: FileStatuses.ERROR,
        errorMessage: errorMessage,
      })

      return
    }

    this.props.uploadClient
      .delete(this.props.element.get("id"), fileId)
      .then(() => this.removeFile(fileId))
  }

  private removeFile = (fileId: string) => {
    const filteredFiles = this.state.files.filter(file => file.id !== fileId)
    this.setState({
      status: filteredFiles.length
        ? FileStatuses.UPLOADED
        : FileStatuses.READY,
      errorMessage: undefined,
      files: filteredFiles,
    })
  }

  private reset = (): void => {
    this.setState({
      status: FileStatuses.READY,
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
    const { maxSizeBytes, errorMessage, files } = this.state
    const { element } = this.props
    const label: string = element.get("label")
    const multipleFiles: boolean = element.get("multipleFiles")
    const acceptedExtensions: string[] = element.get("type").toArray()

    return (
      <div className="Widget stFileUploader">
        <label>{label}</label>
        <Dropzone
          onDrop={this.dropHandler}
          multiple={multipleFiles}
          accept={
            acceptedExtensions.length
              ? acceptedExtensions.map(
                  (value: string): string =>
                    MimeTypes.contentType(value) || `.${value}`
                )
              : undefined
          }
          maxSize={maxSizeBytes}
          disabled={this.props.disabled}
        >
          {({ getRootProps, getInputProps }) => (
            <section {...getRootProps()} className="fileUploadDropzone">
              <input {...getInputProps()} />
              <FileUploaderInstructions
                multipleFiles={multipleFiles}
                acceptedExtensions={acceptedExtensions}
                maxSizeBytes={maxSizeBytes}
              />
              <UIButton label="Browse files" />
            </section>
          )}
        </Dropzone>
        <div className="uploadedFiles row p-3">
          <UploadedFiles
            items={[...files]}
            pageSize={4}
            itemType="files"
            onDelete={this.delete}
            resetOnAdd
          />
        </div>
      </div>
    )
  }
}

export default FileUploader
