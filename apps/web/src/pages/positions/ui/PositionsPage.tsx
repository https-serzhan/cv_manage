import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { useAttributesQuery } from "../../../entities/attribute/model/queries";
import {
  useCreatePositionMutation,
  useDeletePositionMutation,
  useDuplicatePositionMutation,
  usePositionAccessQuery,
  usePositionQuery,
  usePositionsQuery,
  useUpdatePositionAccessMutation,
  useUpdatePositionMutation
} from "../../../entities/position/model/queries";
import type {
  CreatePositionPayload,
  DuplicatePositionPayload,
  GetPositionsParams,
  PositionAccessDto,
  PositionAccessMode,
  PositionDto,
  UpdatePositionAccessPayload,
  UpdatePositionPayload
} from "../../../entities/position/model/types";
import { useCurrentUser } from "../../../entities/user/model/use-current-user";
import { getApiErrorMessage } from "../../../shared/api/client";
import { routes } from "../../../shared/routes/paths";

type PositionFilters = {
  prefix: string;
  accessMode: "" | PositionAccessMode;
  attributeId: string;
  projectTagId: string;
  page: number;
  pageSize: number;
};

type ToolbarAction = "create" | "edit" | "duplicate" | "access" | "delete" | null;

type AttributeChoice = {
  id: string;
  name: string;
  type: string;
};

const initialFilters: PositionFilters = {
  prefix: "",
  accessMode: "",
  attributeId: "",
  projectTagId: "",
  page: 1,
  pageSize: 20
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function parseCommaSeparatedValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCommaSeparatedValues(values: string[]) {
  return values.join(", ");
}

export default function PositionsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PositionFilters>(initialFilters);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ToolbarAction>(null);

  const createMutation = useCreatePositionMutation();
  const updateMutation = useUpdatePositionMutation();
  const deleteMutation = useDeletePositionMutation();
  const duplicateMutation = useDuplicatePositionMutation();
  const updateAccessMutation = useUpdatePositionAccessMutation();
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data?.authenticated ? currentUserQuery.data.user : null;
  const roleCodes = currentUser?.roles.map((role) => role.code) ?? [];
  const canManagePositions = roleCodes.includes("RECRUITER") || roleCodes.includes("ADMIN");
  const canPreviewCv = roleCodes.includes("CANDIDATE") || roleCodes.includes("ADMIN");

  const positionParams: GetPositionsParams = {
    prefix: filters.prefix.trim() || undefined,
    accessMode: filters.accessMode || undefined,
    attributeId: filters.attributeId || undefined,
    projectTagId: filters.projectTagId || undefined,
    page: filters.page,
    pageSize: filters.pageSize
  };

  const positionsQuery = usePositionsQuery(positionParams);
  const tagSourceQuery = usePositionsQuery({
    page: 1,
    pageSize: 100
  });
  const selectedPositionQuery = usePositionQuery(
    selectedPositionId ?? "",
    Boolean(selectedPositionId)
  );
  const selectedAccessQuery = usePositionAccessQuery(
    selectedPositionId ?? "",
    canManagePositions &&
      Boolean(selectedPositionId) &&
      (activeAction === "edit" || activeAction === "access")
  );
  const attributesQuery = useAttributesQuery({
    page: 1,
    pageSize: 100
  });

  const positions = positionsQuery.data?.items ?? [];
  const pagination = positionsQuery.data?.pagination;
  const attributes = attributesQuery.data?.items ?? [];

  const selectedPositionFromList =
    positions.find((position) => position.id === selectedPositionId) ?? null;
  const selectedPosition = selectedPositionQuery.data ?? selectedPositionFromList;

  const projectTagOptions = useMemo(() => {
    const tags = new Map<string, string>();

    for (const position of tagSourceQuery.data?.items ?? []) {
      for (const tag of position.projectTags) {
        tags.set(tag.id, tag.name);
      }
    }

    return [...tags.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [tagSourceQuery.data?.items]);

  const selectedAccessIds =
    selectedAccessQuery.data?.allowedCandidates.map((candidate) => candidate.id) ?? [];

  useEffect(() => {
    if (selectedPositionId && !positions.some((position) => position.id === selectedPositionId)) {
      setSelectedPositionId(null);
      setActiveAction(null);
    }
  }, [positions, selectedPositionId]);

  function updateFilter(nextFilters: Partial<PositionFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1
    }));
    setSelectedPositionId(null);
    setActiveAction(null);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setSelectedPositionId(null);
    setActiveAction(null);
  }

  function selectPosition(positionId: string) {
    setSelectedPositionId((current) => (current === positionId ? null : positionId));
    setActiveAction(null);
  }

  async function createPosition(payload: CreatePositionPayload) {
    const createdPosition = await createMutation.mutateAsync(payload);
    setSelectedPositionId(createdPosition.id);
    setActiveAction(null);
  }

  async function updatePosition(id: string, payload: UpdatePositionPayload) {
    const updatedPosition = await updateMutation.mutateAsync({ id, payload });
    setSelectedPositionId(updatedPosition.id);
    setActiveAction(null);
  }

  async function deletePosition(position: PositionDto) {
    await deleteMutation.mutateAsync({
      id: position.id,
      version: position.version
    });
    setSelectedPositionId(null);
    setActiveAction(null);
  }

  async function duplicatePosition(id: string, payload?: DuplicatePositionPayload) {
    const duplicatedPosition = await duplicateMutation.mutateAsync({
      id,
      payload
    });
    setSelectedPositionId(duplicatedPosition.id);
    setActiveAction(null);
  }

  async function updatePositionAccess(id: string, payload: UpdatePositionAccessPayload) {
    await updateAccessMutation.mutateAsync({
      id,
      payload
    });
    setActiveAction(null);
  }

  function previewSelectedPosition() {
    if (!selectedPositionId) {
      return;
    }

    navigate(routes.cvPreview(selectedPositionId));
  }

  const canGoPrevious = filters.page > 1;
  const canGoNext = pagination ? filters.page < pagination.totalPages : false;
  const hasPositionActions = canManagePositions || canPreviewCv;

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Positions</h1>
          <p className="text-muted mb-0">Browse recruiter-created positions available to you.</p>
        </div>
      </div>

      <div className="mt-4 rounded border bg-body p-3">
        <Row className="g-3 align-items-end">
          <Col md={3}>
            <Form.Label>Title search</Form.Label>
            <Form.Control
              value={filters.prefix}
              placeholder="Search by title"
              onChange={(event) => updateFilter({ prefix: event.currentTarget.value })}
            />
          </Col>

          <Col md={2}>
            <Form.Label>Access mode</Form.Label>
            <Form.Select
              value={filters.accessMode}
              onChange={(event) =>
                updateFilter({
                  accessMode: event.currentTarget.value as PositionFilters["accessMode"]
                })
              }
            >
              <option value="">All access modes</option>
              <option value="PUBLIC">Public</option>
              <option value="RESTRICTED">Restricted</option>
            </Form.Select>
          </Col>

          <Col md={3}>
            <Form.Label>Attribute</Form.Label>
            <Form.Select
              value={filters.attributeId}
              disabled={attributesQuery.isLoading}
              onChange={(event) => updateFilter({ attributeId: event.currentTarget.value })}
            >
              <option value="">All attributes</option>
              {attributes.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.name}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={2}>
            <Form.Label>Project tag</Form.Label>
            <Form.Select
              value={filters.projectTagId}
              disabled={tagSourceQuery.isLoading}
              onChange={(event) => updateFilter({ projectTagId: event.currentTarget.value })}
            >
              <option value="">All tags</option>
              {projectTagOptions.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={2}>
            <Button className="w-100" variant="outline-secondary" onClick={resetFilters}>
              Reset
            </Button>
          </Col>
        </Row>

        {attributesQuery.isError ? (
          <Alert variant="warning" className="mt-3 mb-0">
            Attribute filter failed to load: {getApiErrorMessage(attributesQuery.error)}
          </Alert>
        ) : null}

        {tagSourceQuery.isError ? (
          <Alert variant="warning" className="mt-3 mb-0">
            Project tag filter failed to load: {getApiErrorMessage(tagSourceQuery.error)}
          </Alert>
        ) : null}
      </div>

      {hasPositionActions ? (
        <div className="mt-4 rounded border bg-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <strong>Position actions</strong>
              <div className="text-muted small">
                {selectedPosition
                  ? `Selected: ${selectedPosition.title}`
                  : "Select a row to view details or use selected actions."}
              </div>
            </div>

            <ButtonGroup className="flex-wrap">
              {canManagePositions ? (
                <>
                  <Button variant="primary" onClick={() => setActiveAction("create")}>
                    Create
                  </Button>

                  <Button
                    variant="outline-primary"
                    disabled={!selectedPosition}
                    onClick={() => setActiveAction("edit")}
                  >
                    Edit selected
                  </Button>

                  <Button
                    variant="outline-secondary"
                    disabled={!selectedPosition}
                    onClick={() => setActiveAction("duplicate")}
                  >
                    Duplicate selected
                  </Button>

                  <Button
                    variant="outline-secondary"
                    disabled={!selectedPosition}
                    onClick={() => setActiveAction("access")}
                  >
                    Access
                  </Button>
                </>
              ) : null}

              {canPreviewCv ? (
                <Button
                  variant="outline-secondary"
                  disabled={!selectedPositionId}
                  onClick={previewSelectedPosition}
                >
                  Preview CV
                </Button>
              ) : null}

              {canManagePositions ? (
                <Button
                  variant="outline-danger"
                  disabled={!selectedPosition}
                  onClick={() => setActiveAction("delete")}
                >
                  Delete selected
                </Button>
              ) : null}
            </ButtonGroup>
          </div>
        </div>
      ) : null}

      {selectedPositionId ? (
        <PositionDetailsPanel
          error={selectedPositionQuery.error}
          isError={selectedPositionQuery.isError}
          isLoading={selectedPositionQuery.isLoading}
          position={selectedPosition}
        />
      ) : null}

      {positionsQuery.isLoading ? (
        <div className="page-loading mt-4">
          <Spinner animation="border" size="sm" />
          <span>Loading positions...</span>
        </div>
      ) : null}

      {positionsQuery.isError ? (
        <Alert variant="danger" className="mt-4">
          {getApiErrorMessage(positionsQuery.error)}
        </Alert>
      ) : null}

      {!positionsQuery.isLoading && !positionsQuery.isError && positions.length === 0 ? (
        <Alert variant="info" className="mt-4">
          No positions found.
        </Alert>
      ) : null}

      {!positionsQuery.isError && positions.length > 0 ? (
        <div className="table-responsive mt-4">
          <Table hover bordered className="align-middle">
            <thead>
              <tr>
                <th style={{ width: 48 }}>Select</th>
                <th>Title</th>
                <th>Access</th>
                <th>Max projects</th>
                <th>Attributes</th>
                <th>Project tags</th>
                <th>Allowed candidates</th>
                <th>Updated</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const isSelected = selectedPositionId === position.id;

                return (
                  <tr
                    className={isSelected ? "table-active" : undefined}
                    key={position.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectPosition(position.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectPosition(position.id);
                      }
                    }}
                  >
                    <td>
                      <Form.Check
                        aria-label={`Select ${position.title}`}
                        checked={isSelected}
                        readOnly
                      />
                    </td>
                    <td>
                      <strong>{position.title}</strong>
                      {position.description ? (
                        <div className="text-muted small">{position.description}</div>
                      ) : null}
                    </td>
                    <td>
                      <AccessBadge accessMode={position.accessMode} />
                    </td>
                    <td>{position.maxProjects ?? "No limit"}</td>
                    <td>{position.attributes.length}</td>
                    <td>
                      {position.projectTags.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {position.projectTags.map((tag) => (
                            <Badge bg="secondary" key={tag.id}>
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">No tags</span>
                      )}
                    </td>
                    <td>{position.candidateAccessCount}</td>
                    <td>{formatDate(position.updatedAt)}</td>
                    <td>{position.version}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : null}

      {pagination ? (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
          <p className="text-muted small mb-0">
            Showing {positions.length} of {pagination.total} positions. Page {pagination.page} of{" "}
            {pagination.totalPages || 1}.
          </p>

          <div className="d-flex align-items-center gap-2">
            <Form.Select
              size="sm"
              value={filters.pageSize}
              style={{ width: 120 }}
              onChange={(event) =>
                updateFilter({
                  pageSize: Number(event.currentTarget.value),
                  page: 1
                })
              }
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </Form.Select>

            <Button
              size="sm"
              variant="outline-secondary"
              disabled={!canGoPrevious}
              onClick={() => updateFilter({ page: filters.page - 1 })}
            >
              Previous
            </Button>

            <Button
              size="sm"
              variant="outline-secondary"
              disabled={!canGoNext}
              onClick={() => updateFilter({ page: filters.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {canManagePositions ? (
        <>
          <PositionFormModal
            accessError={selectedAccessQuery.error}
            accessIsError={selectedAccessQuery.isError}
            accessIsLoading={selectedAccessQuery.isLoading}
            availableAttributes={attributes}
            initialAllowedCandidateIds={selectedAccessIds}
            mode={activeAction === "edit" ? "edit" : "create"}
            open={activeAction === "create" || activeAction === "edit"}
            position={activeAction === "edit" ? selectedPosition : null}
            onClose={() => setActiveAction(null)}
            onCreate={createPosition}
            onUpdate={updatePosition}
          />

          <DuplicatePositionModal
            open={activeAction === "duplicate"}
            position={selectedPosition}
            onClose={() => setActiveAction(null)}
            onSubmit={duplicatePosition}
          />

          <PositionAccessModal
            access={selectedAccessQuery.data}
            error={selectedAccessQuery.error}
            isError={selectedAccessQuery.isError}
            isLoading={selectedAccessQuery.isLoading}
            open={activeAction === "access"}
            position={selectedPosition}
            onClose={() => setActiveAction(null)}
            onSubmit={updatePositionAccess}
          />

          <DeletePositionModal
            open={activeAction === "delete"}
            position={selectedPosition}
            onClose={() => setActiveAction(null)}
            onConfirm={deletePosition}
          />
        </>
      ) : null}
    </section>
  );
}

function AccessBadge({ accessMode }: { accessMode: PositionAccessMode }) {
  return (
    <Badge
      bg={accessMode === "PUBLIC" ? "success" : "warning"}
      text={accessMode === "PUBLIC" ? undefined : "dark"}
    >
      {accessMode}
    </Badge>
  );
}

function PositionDetailsPanel({
  error,
  isError,
  isLoading,
  position
}: {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  position: PositionDto | null;
}) {
  if (isLoading && !position) {
    return (
      <div className="mt-4 rounded border bg-body p-3">
        <Spinner animation="border" size="sm" />
        <span className="ms-2">Loading position details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger" className="mt-4">
        {getApiErrorMessage(error)}
      </Alert>
    );
  }

  if (!position) {
    return null;
  }

  return (
    <div className="mt-4 rounded border bg-body p-3">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h2 className="h5 mb-1">{position.title}</h2>
          <div className="text-muted small">
            Created by {position.createdBy?.displayName ?? "Unknown"} · Updated{" "}
            {formatDate(position.updatedAt)} · Version {position.version}
          </div>
        </div>
        <AccessBadge accessMode={position.accessMode} />
      </div>

      {position.description ? <p className="mt-3 mb-0">{position.description}</p> : null}

      <Row className="g-3 mt-1">
        <Col md={4}>
          <div className="text-muted small">Max projects</div>
          <strong>{position.maxProjects ?? "No limit"}</strong>
        </Col>

        <Col md={4}>
          <div className="text-muted small">Allowed candidates</div>
          <strong>{position.candidateAccessCount}</strong>
        </Col>

        <Col md={4}>
          <div className="text-muted small">Attributes</div>
          <strong>{position.attributes.length}</strong>
        </Col>
      </Row>

      <div className="mt-3">
        <div className="fw-semibold mb-2">Required profile attributes</div>
        {position.attributes.length > 0 ? (
          <div className="table-responsive">
            <Table bordered size="sm" className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                {position.attributes.map((item) => (
                  <tr key={item.attribute.id}>
                    <td>{item.attribute.name}</td>
                    <td>{item.attribute.type}</td>
                    <td>{item.isRequired ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <span className="text-muted">No attributes selected.</span>
        )}
      </div>

      <div className="mt-3">
        <div className="fw-semibold mb-2">Project tags</div>
        {position.projectTags.length > 0 ? (
          <div className="d-flex flex-wrap gap-1">
            {position.projectTags.map((tag) => (
              <Badge bg="secondary" key={tag.id}>
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted">No project tags selected.</span>
        )}
      </div>
    </div>
  );
}

function PositionFormModal({
  accessError,
  accessIsError,
  accessIsLoading,
  availableAttributes,
  initialAllowedCandidateIds,
  mode,
  open,
  position,
  onClose,
  onCreate,
  onUpdate
}: {
  accessError: unknown;
  accessIsError: boolean;
  accessIsLoading: boolean;
  availableAttributes: AttributeChoice[];
  initialAllowedCandidateIds: string[];
  mode: "create" | "edit";
  open: boolean;
  position: PositionDto | null;
  onClose: () => void;
  onCreate: (payload: CreatePositionPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdatePositionPayload) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accessMode, setAccessMode] = useState<PositionAccessMode>("PUBLIC");
  const [maxProjects, setMaxProjects] = useState("");
  const [projectTagsText, setProjectTagsText] = useState("");
  const [allowedCandidateIdsText, setAllowedCandidateIdsText] = useState("");
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [requiredAttributeIds, setRequiredAttributeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialAllowedCandidateIdsText = formatCommaSeparatedValues(initialAllowedCandidateIds);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(position?.title ?? "");
    setDescription(position?.description ?? "");
    setAccessMode(position?.accessMode ?? "PUBLIC");
    setMaxProjects(position?.maxProjects ? String(position.maxProjects) : "");
    setProjectTagsText(
      formatCommaSeparatedValues(position?.projectTags.map((tag) => tag.name) ?? [])
    );
    setAllowedCandidateIdsText(initialAllowedCandidateIdsText);
    setSelectedAttributeIds(position?.attributes.map((item) => item.attribute.id) ?? []);
    setRequiredAttributeIds(
      position?.attributes.filter((item) => item.isRequired).map((item) => item.attribute.id) ?? []
    );
    setError(null);
    setIsSubmitting(false);
  }, [initialAllowedCandidateIdsText, open, position]);

  function toggleAttribute(attributeId: string) {
    setSelectedAttributeIds((current) => {
      if (current.includes(attributeId)) {
        return current.filter((id) => id !== attributeId);
      }

      return [...current, attributeId];
    });

    setRequiredAttributeIds((current) => current.filter((id) => id !== attributeId));
  }

  function toggleRequiredAttribute(attributeId: string) {
    setRequiredAttributeIds((current) => {
      if (current.includes(attributeId)) {
        return current.filter((id) => id !== attributeId);
      }

      return [...current, attributeId];
    });
  }

  async function submitForm() {
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedMaxProjects = maxProjects.trim();

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    const parsedMaxProjects = trimmedMaxProjects ? Number(trimmedMaxProjects) : null;

    if (
      parsedMaxProjects !== null &&
      (!Number.isInteger(parsedMaxProjects) || parsedMaxProjects < 1)
    ) {
      setError("Max projects must be a positive whole number.");
      return;
    }

    const payloadBase: CreatePositionPayload = {
      title: trimmedTitle,
      description: trimmedDescription || null,
      accessMode,
      maxProjects: parsedMaxProjects,
      attributes: selectedAttributeIds.map((attributeId) => ({
        attributeId,
        isRequired: requiredAttributeIds.includes(attributeId)
      })),
      projectTagNames: parseCommaSeparatedValues(projectTagsText),
      allowedCandidateUserIds:
        accessMode === "RESTRICTED" ? parseCommaSeparatedValues(allowedCandidateIdsText) : []
    };

    try {
      setIsSubmitting(true);

      if (mode === "edit" && position) {
        await onUpdate(position.id, {
          ...payloadBase,
          version: position.version
        });
      } else {
        await onCreate(payloadBase);
      }
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
      setIsSubmitting(false);
    }
  }

  const isAccessBlocked =
    mode === "edit" && position?.accessMode === "RESTRICTED" && (accessIsLoading || accessIsError);

  return (
    <Modal show={open} size="lg" onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{mode === "edit" ? "Edit position" : "Create position"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        {isAccessBlocked && accessIsLoading ? (
          <Alert variant="info">Loading restricted access list...</Alert>
        ) : null}

        {isAccessBlocked && accessIsError ? (
          <Alert variant="danger">{getApiErrorMessage(accessError)}</Alert>
        ) : null}

        <Row className="g-3">
          <Col md={8}>
            <Form.Label>Title</Form.Label>
            <Form.Control value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
          </Col>

          <Col md={4}>
            <Form.Label>Access mode</Form.Label>
            <Form.Select
              value={accessMode}
              onChange={(event) => setAccessMode(event.currentTarget.value as PositionAccessMode)}
            >
              <option value="PUBLIC">Public</option>
              <option value="RESTRICTED">Restricted</option>
            </Form.Select>
          </Col>

          <Col md={12}>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </Col>

          <Col md={4}>
            <Form.Label>Max projects</Form.Label>
            <Form.Control
              min={1}
              type="number"
              value={maxProjects}
              placeholder="No limit"
              onChange={(event) => setMaxProjects(event.currentTarget.value)}
            />
          </Col>

          <Col md={8}>
            <Form.Label>Project tag names</Form.Label>
            <Form.Control
              value={projectTagsText}
              placeholder="React, Node.js, PostgreSQL"
              onChange={(event) => setProjectTagsText(event.currentTarget.value)}
            />
            <Form.Text>Separate tag names with commas.</Form.Text>
          </Col>

          {accessMode === "RESTRICTED" ? (
            <Col md={12}>
              <Form.Label>Allowed candidate user IDs</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={allowedCandidateIdsText}
                placeholder="candidate-user-id-1, candidate-user-id-2"
                onChange={(event) => setAllowedCandidateIdsText(event.currentTarget.value)}
              />
              <Form.Text>
                Separate user IDs with commas. This uses IDs because there is no candidate search
                endpoint yet.
              </Form.Text>
            </Col>
          ) : null}
        </Row>

        <div className="mt-4">
          <div className="fw-semibold mb-2">Position attributes</div>

          {availableAttributes.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No attributes available.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table bordered hover size="sm" className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 64 }}>Use</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th style={{ width: 120 }}>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {availableAttributes.map((attribute) => {
                    const isSelected = selectedAttributeIds.includes(attribute.id);

                    return (
                      <tr key={attribute.id}>
                        <td>
                          <Form.Check
                            checked={isSelected}
                            onChange={() => toggleAttribute(attribute.id)}
                          />
                        </td>
                        <td>{attribute.name}</td>
                        <td>{attribute.type}</td>
                        <td>
                          <Form.Check
                            checked={isSelected && requiredAttributeIds.includes(attribute.id)}
                            disabled={!isSelected}
                            onChange={() => toggleRequiredAttribute(attribute.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={isSubmitting || isAccessBlocked} variant="primary" onClick={submitForm}>
          {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create position"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function DuplicatePositionModal({
  open,
  position,
  onClose,
  onSubmit
}: {
  open: boolean;
  position: PositionDto | null;
  onClose: () => void;
  onSubmit: (id: string, payload?: DuplicatePositionPayload) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(position ? `Copy of ${position.title}` : "");
    setError(null);
    setIsSubmitting(false);
  }, [open, position]);

  async function submitDuplicate() {
    if (!position) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(position.id, title.trim() ? { title: title.trim() } : undefined);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
      setIsSubmitting(false);
    }
  }

  return (
    <Modal show={open} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Duplicate position</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form.Label>New title</Form.Label>
        <Form.Control value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!position || isSubmitting} variant="primary" onClick={submitDuplicate}>
          {isSubmitting ? "Duplicating..." : "Duplicate"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function PositionAccessModal({
  access,
  error,
  isError,
  isLoading,
  open,
  position,
  onClose,
  onSubmit
}: {
  access: PositionAccessDto | undefined;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  open: boolean;
  position: PositionDto | null;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdatePositionAccessPayload) => Promise<void>;
}) {
  const [accessMode, setAccessMode] = useState<PositionAccessMode>("PUBLIC");
  const [allowedCandidateIdsText, setAllowedCandidateIdsText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedCandidateIdsTextFromAccess = formatCommaSeparatedValues(
    access?.allowedCandidates.map((candidate) => candidate.id) ?? []
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setAccessMode(access?.accessMode ?? position?.accessMode ?? "PUBLIC");
    setAllowedCandidateIdsText(allowedCandidateIdsTextFromAccess);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [access?.accessMode, allowedCandidateIdsTextFromAccess, open, position]);

  async function submitAccess() {
    if (!position) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(position.id, {
        accessMode,
        allowedCandidateUserIds:
          accessMode === "RESTRICTED" ? parseCommaSeparatedValues(allowedCandidateIdsText) : [],
        version: position.version
      });
    } catch (accessSubmitError) {
      setSubmitError(getApiErrorMessage(accessSubmitError));
      setIsSubmitting(false);
    }
  }

  return (
    <Modal show={open} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Manage position access</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

        {isLoading ? <Alert variant="info">Loading access settings...</Alert> : null}

        {isError ? <Alert variant="danger">{getApiErrorMessage(error)}</Alert> : null}

        <Form.Label>Access mode</Form.Label>
        <Form.Select
          className="mb-3"
          disabled={isLoading || isError}
          value={accessMode}
          onChange={(event) => setAccessMode(event.currentTarget.value as PositionAccessMode)}
        >
          <option value="PUBLIC">Public</option>
          <option value="RESTRICTED">Restricted</option>
        </Form.Select>

        {accessMode === "RESTRICTED" ? (
          <>
            <Form.Label>Allowed candidate user IDs</Form.Label>
            <Form.Control
              as="textarea"
              disabled={isLoading || isError}
              rows={3}
              value={allowedCandidateIdsText}
              onChange={(event) => setAllowedCandidateIdsText(event.currentTarget.value)}
            />
            <Form.Text>Separate user IDs with commas.</Form.Text>

            {access?.allowedCandidates.length ? (
              <div className="mt-3">
                <div className="fw-semibold mb-2">Current allowed candidates</div>
                <div className="d-flex flex-column gap-1">
                  {access.allowedCandidates.map((candidate) => (
                    <div key={candidate.id}>
                      {candidate.displayName}{" "}
                      <span className="text-muted">({candidate.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <Alert variant="info" className="mb-0">
            Public positions are visible without a candidate access list.
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!position || isLoading || isError || isSubmitting}
          variant="primary"
          onClick={submitAccess}
        >
          {isSubmitting ? "Saving..." : "Save access"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function DeletePositionModal({
  open,
  position,
  onClose,
  onConfirm
}: {
  open: boolean;
  position: PositionDto | null;
  onClose: () => void;
  onConfirm: (position: PositionDto) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setIsSubmitting(false);
  }, [open, position]);

  async function confirmDelete() {
    if (!position) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(position);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
      setIsSubmitting(false);
    }
  }

  return (
    <Modal show={open} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Delete position</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <p className="mb-0">
          Are you sure you want to delete <strong>{position?.title ?? "this position"}</strong>?
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!position || isSubmitting} variant="danger" onClick={confirmDelete}>
          {isSubmitting ? "Deleting..." : "Delete"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
