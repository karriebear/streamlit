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
import classNames from "classnames"
import { Button as BaseUIButton } from "baseui/button"
import { buttonOverrides } from "lib/widgetTheme"

export interface Props {
  label: string
  disabled?: boolean
  onClick?: () => any
  className?: string
  style?: any
}

class UIButton extends React.PureComponent<Props> {
  public render(): React.ReactNode {
    return (
      <div
        className={classNames("stButton", this.props.className)}
        style={this.props.style}
      >
        <BaseUIButton
          disabled={this.props.disabled}
          onClick={this.props.onClick}
          overrides={buttonOverrides}
        >
          {this.props.label}
        </BaseUIButton>
      </div>
    )
  }
}

export default UIButton
