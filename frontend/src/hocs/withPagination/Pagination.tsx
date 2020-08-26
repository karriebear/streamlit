import React from "react"
import { MaterialIcon } from "components/shared/Icon"
import { IconButton } from "components/widgets/Button"

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
      <small>{`Showing ${currentPage} of ${totalPages} pages`}</small>
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
