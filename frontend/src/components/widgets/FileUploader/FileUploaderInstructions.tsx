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
import React, { ReactElement } from "react"
import { styled } from "styletron-react"
import { MaterialIcon } from "components/shared/Icon"
import { getSizeDisplay } from "lib/FileHelper"

export interface Props {
  multipleFiles: boolean
  acceptedExtensions: string[]
  maxSizeBytes: number
}

const FileUploaderInstructions = ({
  multipleFiles,
  acceptedExtensions,
  maxSizeBytes,
}: Props): ReactElement => {
  const StyledContainer = styled("div", {
    marginRight: "auto",
    alignItems: "center",
    display: "flex",
    "@media (max-width: 880px)": {
      display: "none",
    },
  })
  return (
    <StyledContainer>
      <MaterialIcon
        icon="cloud_upload"
        className="mr-3 text-secondary icon-lg"
        type="outlined"
      />
      <div className="d-flex flex-column">
        <span>Drag and drop file{multipleFiles ? "s" : ""} here</span>
        <small>
          {`Limit ${getSizeDisplay(maxSizeBytes, "b", 0)} per file`}
          {acceptedExtensions.length
            ? ` • ${acceptedExtensions
                .join(", ")
                .replace(".", "")
                .toUpperCase()}`
            : null}
        </small>
      </div>
    </StyledContainer>
  )
}

export default FileUploaderInstructions
