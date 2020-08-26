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
import React, { ReactElement, useState } from "react"
import { MaterialIcon } from "components/shared/Icon"
import withPagination from "hocs/withPagination"
import { ExtendedFile } from "lib/FileHelper"
import UploadedFile from "./UploadedFile"

export interface Props {
  items: ExtendedFile[]
  onDelete: (
    event: React.SyntheticEvent<HTMLElement> | null,
    id?: string
  ) => void
}

export const UploadedFiles = ({ items, onDelete }: Props): ReactElement => {
  const [showFiles, setShowFiles] = useState(true)
  const toggleFiles = () => {
    setShowFiles(!showFiles)
  }

  return showFiles ? (
    <>
      {items.map((file, index) => (
        <UploadedFile
          file={file}
          progress={file.progress || 10}
          onDelete={onDelete}
        />
      ))}
    </>
  ) : (
    <div onClick={toggleFiles}>
      <MaterialIcon icon="chevron_right" className="text-secondary" />
      {`${items.length} files`}
    </div>
  )
}

export default withPagination(UploadedFiles)
