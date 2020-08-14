import React from "react"
import Icon from "components/shared/Icon"

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
          <Icon className="icon icon-xs" type="chevron-left" />
        </div>
        <div onClick={onNext}>
          <Icon className="icon icon-xs ml-3" type="chevron-right" />
        </div>
      </div>
    </div>
  )
}

export default Pagination
