import React from "react"
import { MaterialIcon } from "components/shared/Icon"

interface Props {
  currentPage: number
  totalPages: number
  pageSize: number
  onNext: (event: React.SyntheticEvent<HTMLElement>) => void
  onPrevious: (event: React.SyntheticEvent<HTMLElement>) => void
}

const Pagination = ({
  currentPage,
  totalPages,
  onNext,
  onPrevious,
}: Props) => {
  return (
    <div className="col-12 d-flex align-items-center justify-content-between pb-1 mb-1">
      <small className="text-secondary">
        {`Showing ${currentPage} of ${totalPages} pages`}
      </small>
      <div className="d-flex align-items-center justify-content-center text-secondary">
        <div onClick={onPrevious}>
          <MaterialIcon className="icon icon-xs" icon="chevron_left" />
        </div>
        <div onClick={onNext}>
          <MaterialIcon className="icon icon-xs ml-3" icon="chevron_right" />
        </div>
      </div>
    </div>
  )
}

export default Pagination
