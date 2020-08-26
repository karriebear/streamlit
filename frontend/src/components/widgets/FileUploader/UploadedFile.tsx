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

import { CancelTokenSource } from "axios"
import ProgressBar from "components/shared/ProgressBar"
import Icon from "components/shared/Icon"
import { MaterialIcon } from "components/shared/Icon"
import { ExtendedFile, getSizeDisplay } from "lib/FileHelper"
import React from "react"
import { Button } from "reactstrap"
import "./FileUploader.scss"

export interface Props {
  file: ExtendedFile
  progress: number | undefined
  onDelete: (
    event: React.SyntheticEvent<HTMLElement> | null,
    id?: string
  ) => void
}

class UploadedFile extends React.PureComponent<Props> {
  private currentUploadCanceller?: CancelTokenSource
  public constructor(props: Props) {
    super(props)
    this.state = {
      status: "READY",
      errorMessage: undefined,
      files: [],
    }
  }

  private cancelCurrentUpload = (): void => {
    if (this.currentUploadCanceller != null) {
      this.currentUploadCanceller.cancel()
      this.currentUploadCanceller = undefined
    }
  }

  private renderFileStatus = () => {
    const { file, progress } = this.props

    if (progress) {
      return (
        <ProgressBar
          value={progress}
          size="small"
          overrides={{
            Bar: {
              style: {
                marginLeft: 0,
                marginTop: "4px",
              },
            },
          }}
        />
      )
    }

    if (file.status === "ERROR") {
      return (
        <small className="text-danger d-flex">
          {file.errorMessage || "error"}
          <Icon className="icon ml-1" type="warning" />{" "}
        </small>
      )
    }

    if (file.status === "UPLOADED") {
      return (
        <small style={{ height: "20px" }}>{`Uploaded • ${getSizeDisplay(
          file.size,
          "b"
        )}`}</small>
      )
    }

    return null
  }

  public render = (): React.ReactNode => {
    const { file, onDelete } = this.props

    return (
      <div className="uploadedFile col-md-6">
        <div className="fileIcon">
          <MaterialIcon
            type="outlined"
            icon="insert_drive_file"
            className="icon-md icon text-secondary"
          />
        </div>
        <div className="uploadedFileData">
          <div className="mb-1 text-truncate">{file.name}</div>
          {this.renderFileStatus()}
        </div>
        <Button close onClick={onDelete} id={file.id} />
      </div>
    )
  }
}

export default UploadedFile
