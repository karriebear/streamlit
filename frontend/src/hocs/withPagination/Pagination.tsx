import React from "react"
import classnames from "classnames"
import { MaterialIcon } from "components/shared/Icon"
import { IconButton } from "components/widgets/Button"

interface Props {
  classNames: string
  currentPage: number
  totalPages: number
  pageSize: number
  onNext: (event: React.SyntheticEvent<HTMLElement>) => void
  onPrevious: (event: React.SyntheticEvent<HTMLElement>) => void
}

const Pagination = ({
  classNames,
  currentPage,
  totalPages,
  onNext,
  onPrevious,
}: Props) => {
  return (
    <div
      className={classnames(
        "d-flex align-items-center justify-content-between pb-1 mb-1",
        classNames
      )}
    >
      <small>{`Showing page ${currentPage} of ${totalPages}`}</small>
      <div className="d-flex align-items-center justify-content-center text-secondary">
        <IconButton onClick={onPrevious}>
          <MaterialIcon icon="chevron_left" />
        </IconButton>
        <IconButton onClick={onNext}>
          <MaterialIcon icon="chevron_right" />
        </IconButton>
      </div>
    </div>
  )
}

export default Pagination
