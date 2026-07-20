import { Alert, Badge, Col, Image, Row, Spinner, Stack, Table } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";

import { useCvPreviewQuery } from "../../../entities/cv/model/queries";
import type { CvPreviewDto, CvPreviewProjectDto } from "../../../entities/cv/model/types";
import { getApiErrorMessage } from "../../../shared/api/client";
import { routes } from "../../../shared/routes/paths";

function formatDate(value: string | null) {
  return value ?? "-";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatProjectDates(project: CvPreviewProjectDto) {
  return `${formatDate(project.startDate)} - ${
    project.isCurrent ? "Present" : formatDate(project.endDate)
  }`;
}

function formatProjectTagNames(preview: CvPreviewDto) {
  return preview.position.projectTags.map((tag) => tag.name).join(", ");
}

export default function CvPreviewPage() {
  const { positionId } = useParams<{ positionId: string }>();
  const previewQuery = useCvPreviewQuery(positionId ?? "", Boolean(positionId));

  if (!positionId) {
    return (
      <section className="page-section">
        <Alert variant="warning" className="mb-0">
          Position id is required.
        </Alert>
      </section>
    );
  }

  if (previewQuery.isLoading) {
    return (
      <section className="page-section">
        <div className="profile-loading">
          <Spinner animation="border" role="status" />
          <span>Loading CV preview</span>
        </div>
      </section>
    );
  }

  if (previewQuery.isError) {
    return (
      <section className="page-section">
        <Alert variant="danger" className="mb-0 error-message">
          {getApiErrorMessage(previewQuery.error)}
        </Alert>
      </section>
    );
  }

  if (!previewQuery.data) {
    return (
      <section className="page-section">
        <Alert variant="info" className="mb-0">
          CV preview is not available.
        </Alert>
      </section>
    );
  }

  return <CvPreviewContent preview={previewQuery.data} />;
}

function CvPreviewContent({ preview }: { preview: CvPreviewDto }) {
  const { candidate, position } = preview;
  const missingRequiredCount = preview.missingRequiredAttributes.length;
  const includedProjectCount = preview.projects.length;
  const hasMissingRequiredAttributes = missingRequiredCount > 0;
  const hasProjectTagFilter = position.projectTags.length > 0;
  const isReady = missingRequiredCount === 0;
  const projectTagNames = formatProjectTagNames(preview);

  return (
    <section className="profile-page">
      <Stack gap={4}>
        <div className="profile-page__header">
          <div>
            <h1 className="h3 mb-1">CV Preview</h1>
            <p className="text-secondary mb-0">
              {position.title} · Generated {formatDateTime(preview.generatedAt)}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link className="btn btn-outline-secondary" to={routes.positions}>
              Back to positions
            </Link>
            <Link className="btn btn-primary" to={routes.profile}>
              Edit profile
            </Link>
          </div>
        </div>

        <section className="profile-section">
          <div className="profile-section__heading">
            <div>
              <h2 className="h5 mb-1">Readiness</h2>
              <span className="text-secondary">
                {isReady ? "Ready for this position" : "Needs attention before sharing"}
              </span>
            </div>
            <Badge bg={isReady ? "success" : "warning"} text={isReady ? undefined : "dark"}>
              {isReady ? "Ready" : "Needs attention"}
            </Badge>
          </div>

          <Alert variant={isReady ? "success" : "warning"}>
            {isReady
              ? "All required attributes for this position are provided."
              : "Required profile details are missing for this position."}
          </Alert>

          <Row className="g-3">
            <Col md={3}>
              <div className="text-muted small">Missing required attributes</div>
              <strong>{missingRequiredCount}</strong>
            </Col>
            <Col md={3}>
              <div className="text-muted small">Included projects</div>
              <strong>{includedProjectCount}</strong>
            </Col>
            <Col md={3}>
              <div className="text-muted small">Max projects</div>
              <strong>{position.maxProjects ?? "No limit"}</strong>
            </Col>
            <Col md={3}>
              <div className="text-muted small">Project tag filters</div>
              {hasProjectTagFilter ? (
                <div className="profile-tag-list mt-1">
                  {position.projectTags.map((tag) => (
                    <Badge bg="secondary" key={tag.id}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <strong>All projects</strong>
              )}
            </Col>
          </Row>
        </section>

        {hasMissingRequiredAttributes ? (
          <Alert variant="warning" className="mb-0">
            <div className="fw-semibold mb-2">Missing required attributes</div>
            <p className="mb-2">Update your profile to improve readiness for {position.title}.</p>
            <div className="profile-tag-list mb-3">
              {preview.missingRequiredAttributes.map((attribute) => (
                <Badge bg="warning" text="dark" key={attribute.attributeId}>
                  {attribute.name} · {attribute.type}
                </Badge>
              ))}
            </div>
            <Link className="btn btn-outline-warning" to={routes.profile}>
              Edit profile
            </Link>
          </Alert>
        ) : null}

        <section className="profile-section">
          <div className="profile-section__heading">
            <div>
              <h2 className="h5 mb-1">{candidate.displayName}</h2>
              <span className="text-secondary">{candidate.email}</span>
            </div>
            <AccessBadge accessMode={position.accessMode} />
          </div>

          <Row className="g-4 align-items-start">
            {candidate.profile.avatarImageUrl ? (
              <Col md="auto">
                <Image
                  alt={candidate.displayName}
                  src={candidate.profile.avatarImageUrl}
                  roundedCircle
                  style={{ width: 96, height: 96, objectFit: "cover" }}
                />
              </Col>
            ) : null}

            <Col>
              <Row className="g-3">
                <Col md={4}>
                  <div className="text-muted small">Headline</div>
                  <strong>{candidate.profile.headline ?? "Not provided"}</strong>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Location</div>
                  <strong>{candidate.profile.location ?? "Not provided"}</strong>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Position max projects</div>
                  <strong>{position.maxProjects ?? "No limit"}</strong>
                </Col>
              </Row>

              {candidate.profile.summary ? (
                <p className="mt-3 mb-0">{candidate.profile.summary}</p>
              ) : (
                <p className="mt-3 mb-0 text-muted">Summary not provided.</p>
              )}
            </Col>
          </Row>
        </section>

        <section className="profile-section">
          <div className="profile-section__heading">
            <h2 className="h5 mb-0">Position filters</h2>
            <span className="text-secondary">{position.projectTags.length} project tags</span>
          </div>

          {position.description ? <p>{position.description}</p> : null}

          <Row className="g-3">
            <Col md={4}>
              <div className="text-muted small">Access mode</div>
              <AccessBadge accessMode={position.accessMode} />
            </Col>
            <Col md={4}>
              <div className="text-muted small">Max projects</div>
              <strong>{position.maxProjects ?? "No limit"}</strong>
            </Col>
            <Col md={4}>
              <div className="text-muted small">Project tags</div>
              {position.projectTags.length > 0 ? (
                <div className="profile-tag-list mt-1">
                  {position.projectTags.map((tag) => (
                    <Badge bg="secondary" key={tag.id}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted">All projects</span>
              )}
            </Col>
          </Row>
        </section>

        <section className="profile-section">
          <div className="profile-section__heading">
            <h2 className="h5 mb-0">Attributes</h2>
            <span className="text-secondary">{preview.attributes.length} selected</span>
          </div>

          {preview.attributes.length > 0 ? (
            <div className="table-responsive">
              <Table bordered hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.attributes.map((attribute) => (
                    <tr key={attribute.attributeId}>
                      <td className="fw-semibold">{attribute.name}</td>
                      <td>{attribute.category.name}</td>
                      <td>{attribute.type}</td>
                      <td>{attribute.isRequired ? "Yes" : "No"}</td>
                      <td>
                        {attribute.displayValue ? (
                          attribute.displayValue
                        ) : (
                          <span className="text-muted">Not provided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info" className="mb-0">
              This position does not request any profile attributes.
            </Alert>
          )}
        </section>

        <section className="profile-section">
          <div className="profile-section__heading">
            <h2 className="h5 mb-0">Projects</h2>
            <span className="text-secondary">{preview.projects.length} included</span>
          </div>

          {preview.projects.length > 0 ? (
            <Stack gap={3}>
              {preview.projects.map((project) => (
                <div className="rounded border p-3" key={project.id}>
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                    <div>
                      <h3 className="h6 mb-1">{project.title}</h3>
                      <div className="text-secondary small">
                        {project.role || "Role not provided"} · {formatProjectDates(project)}
                      </div>
                    </div>
                    {project.isCurrent ? <Badge bg="success">Current</Badge> : null}
                  </div>

                  {project.description ? <p className="mt-3 mb-2">{project.description}</p> : null}

                  {project.url ? (
                    <a href={project.url} target="_blank" rel="noreferrer">
                      {project.url}
                    </a>
                  ) : null}

                  {project.tags.length > 0 ? (
                    <div className="profile-tag-list mt-3">
                      {project.tags.map((tag) => (
                        <Badge bg="secondary" key={tag.id}>
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </Stack>
          ) : (
            <Alert variant="info" className="mb-0">
              {hasProjectTagFilter
                ? `No projects matched the position project tags: ${projectTagNames}.`
                : "No projects are available for this preview."}
            </Alert>
          )}
        </section>
      </Stack>
    </section>
  );
}

function AccessBadge({ accessMode }: { accessMode: "PUBLIC" | "RESTRICTED" }) {
  return (
    <Badge
      bg={accessMode === "PUBLIC" ? "success" : "warning"}
      text={accessMode === "PUBLIC" ? undefined : "dark"}
    >
      {accessMode}
    </Badge>
  );
}
