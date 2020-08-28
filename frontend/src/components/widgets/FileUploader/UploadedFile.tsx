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
import React from "react"
import { Delete } from "baseui/icon"
import { MaterialIcon } from "components/shared/Icon"
import { IconButton } from "components/widgets/Button"
import ProgressBar from "components/shared/ProgressBar"
import { ExtendedFile, FileStatuses, getSizeDisplay } from "lib/FileHelper"

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
      status: FileStatuses.READY,
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

    if (file.status === FileStatuses.ERROR) {
      return (
        <small className="text-danger d-flex align-items-center">
          {file.errorMessage || "error"}
          <MaterialIcon icon="error" className="ml-1" />
        </small>
      )
    }

    if (file.status === FileStatuses.UPLOADED) {
      return <small>{getSizeDisplay(file.size, "b")}</small>
    }

    if (file.status === FileStatuses.DELETING) {
      return <small>Removing file</small>
    }

    return null
  }

  public render = (): React.ReactNode => {
    const { file, onDelete } = this.props

    return (
      <div className="uploadedFile">
        <div className="fileIcon">
          <MaterialIcon
            type="outlined"
            icon="insert_drive_file"
            className="icon-md"
          />
        </div>
        <div className="uploadedFileData">
          <div className="mr-2 text-truncate" title={file.name}>
            {file.name}
          </div>
          {this.renderFileStatus()}
        </div>
        <IconButton onClick={onDelete} id={file.id}>
          <Delete size={22} />
        </IconButton>
      </div>
    )
  }
}

export default UploadedFile
