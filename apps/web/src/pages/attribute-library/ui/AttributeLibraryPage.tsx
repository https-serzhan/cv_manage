import { useMemo, useState } from "react";
import { Alert, Badge, Button, ButtonGroup, Form, Spinner, Stack, Table } from "react-bootstrap";

import type { Attribute, GetAttributesParams } from "../../../entities/attribute/model/types";
import {
  useAttributeCategoriesQuery,
  useAttributesQuery
} from "../../../entities/attribute/model/queries";
import { AttributeFilters } from "../../../features/attribute-filters/ui/AttributeFilters";
import { CreateAttributeModal } from "../../../features/create-attribute/ui/CreateAttributeModal";
import { DeleteAttributeModal } from "../../../features/delete-attribute/ui/DeleteAttributeModal";
import { EditAttributeModal } from "../../../features/edit-attribute/ui/EditAttributeModal";
import { getApiErrorMessage } from "../../../shared/api/client";

const pageSizeOptions = [10, 20, 50] as const;

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export default function AttributeLibraryPage() {
  const [filters, setFilters] = useState<GetAttributesParams>({
    page: 1,
    pageSize: 20
  });
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"create" | "edit" | "delete" | null>(null);

  const categoriesQuery = useAttributeCategoriesQuery();
  const attributesQuery = useAttributesQuery(filters);
  const categories = categoriesQuery.data ?? [];
  const attributes = attributesQuery.data?.items ?? [];
  const pagination = attributesQuery.data?.pagination;
  const selectedAttribute = useMemo<Attribute | null>(
    () => attributes.find((attribute) => attribute.id === selectedAttributeId) ?? null,
    [attributes, selectedAttributeId]
  );

  function applyFilters(nextFilters: GetAttributesParams) {
    setSelectedAttributeId(null);
    setFilters({
      ...nextFilters,
      page: nextFilters.page ?? 1,
      pageSize: nextFilters.pageSize ?? filters.pageSize ?? 20
    });
  }

  function changePage(page: number) {
    setSelectedAttributeId(null);
    setFilters((currentFilters) => ({
      ...currentFilters,
      page
    }));
  }

  function changePageSize(pageSize: number) {
    setSelectedAttributeId(null);
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
      pageSize
    }));
  }

  const isInitialLoading =
    (categoriesQuery.isLoading || attributesQuery.isLoading) && !attributesQuery.data;
  const loadError = categoriesQuery.error ?? attributesQuery.error;
  const currentPage = pagination?.page ?? filters.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <section className="attribute-library-page">
      <Stack gap={4}>
        <div className="attribute-library-page__header">
          <div>
            <h1 className="h3 mb-1">Attribute Library</h1>
            <p className="text-secondary mb-0">Manage reusable candidate and CV attributes.</p>
          </div>
          {attributesQuery.isFetching && !isInitialLoading ? (
            <Badge bg="secondary">Updating</Badge>
          ) : null}
        </div>

        {loadError ? (
          <Alert variant="danger" className="mb-0 error-message">
            {getApiErrorMessage(loadError)}
          </Alert>
        ) : null}

        <AttributeFilters categories={categories} values={filters} onApply={applyFilters} />

        <div className="attribute-toolbar">
          <ButtonGroup>
            <Button type="button" onClick={() => setActiveModal("create")}>
              Create
            </Button>
            <Button
              type="button"
              variant="outline-primary"
              disabled={!selectedAttribute}
              onClick={() => setActiveModal("edit")}
            >
              Edit selected
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              disabled={!selectedAttribute}
              onClick={() => setActiveModal("delete")}
            >
              Delete selected
            </Button>
          </ButtonGroup>
        </div>

        {isInitialLoading ? (
          <div className="attribute-loading">
            <Spinner animation="border" role="status" />
            <span>Loading attributes</span>
          </div>
        ) : null}

        {!isInitialLoading ? (
          <div className="table-responsive attribute-table-wrap">
            <Table hover className="align-middle attribute-table">
              <thead>
                <tr>
                  <th scope="col" className="attribute-table__select">
                    Select
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Category</th>
                  <th scope="col">Type</th>
                  <th scope="col">Description</th>
                  <th scope="col">Options</th>
                  <th scope="col">Version</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attribute) => {
                  const isSelected = attribute.id === selectedAttributeId;

                  return (
                    <tr
                      key={attribute.id}
                      className={
                        isSelected ? "table-active attribute-table__row" : "attribute-table__row"
                      }
                      onClick={() => setSelectedAttributeId(attribute.id)}
                    >
                      <td>
                        <Form.Check
                          type="radio"
                          name="selectedAttribute"
                          aria-label={`Select ${attribute.name}`}
                          checked={isSelected}
                          readOnly
                        />
                      </td>
                      <td className="fw-semibold">{attribute.name}</td>
                      <td>{attribute.category.name}</td>
                      <td>{attribute.type}</td>
                      <td className="attribute-table__description">
                        {attribute.description || "-"}
                      </td>
                      <td>{attribute.options.length}</td>
                      <td>{attribute.version}</td>
                      <td>{formatDateTime(attribute.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {attributes.length === 0 ? (
              <div className="attribute-empty-state">No attributes found.</div>
            ) : null}
          </div>
        ) : null}

        {pagination ? (
          <div className="attribute-pagination">
            <div className="text-secondary">
              Page {pagination.page} of {pagination.totalPages || 1}, {pagination.total} total
            </div>
            <div className="attribute-pagination__controls">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => changePage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => changePage(currentPage + 1)}
              >
                Next
              </Button>
              <Form.Select
                size="sm"
                className="attribute-pagination__page-size"
                value={filters.pageSize ?? 20}
                onChange={(event) => changePageSize(Number(event.currentTarget.value))}
              >
                {pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize} rows
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        ) : null}
      </Stack>

      <CreateAttributeModal
        show={activeModal === "create"}
        categories={categories}
        onHide={() => setActiveModal(null)}
      />
      <EditAttributeModal
        show={activeModal === "edit"}
        attribute={selectedAttribute}
        categories={categories}
        onHide={() => setActiveModal(null)}
      />
      <DeleteAttributeModal
        show={activeModal === "delete"}
        attribute={selectedAttribute}
        onDeleted={() => setSelectedAttributeId(null)}
        onHide={() => setActiveModal(null)}
      />
    </section>
  );
}
