import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Form,
  Modal,
  Spinner,
  Stack,
  Table
} from "react-bootstrap";
import { Link } from "react-router-dom";

import { useAttributesQuery } from "../../../entities/attribute/model/queries";
import type { CandidateProject, CreateProjectPayload } from "../../../entities/profile/model/types";
import {
  useCreateMyProjectMutation,
  useMyProfileAttributesQuery,
  useMyProfileQuery,
  useMyProjectsQuery,
  useUpdateMyProjectMutation
} from "../../../entities/profile/model/queries";
import { useCurrentUser } from "../../../entities/user/model/use-current-user";
import { ProfileAttributeEditor } from "../../../features/profile-attribute-editor/ui/ProfileAttributeEditor";
import { ProfileBasicForm } from "../../../features/profile-basic-form/ui/ProfileBasicForm";
import { DeleteProjectModal } from "../../../features/profile-project-delete/ui/DeleteProjectModal";
import {
  ProfileProjectForm,
  projectToFormValues
} from "../../../features/profile-project-form/ui/ProfileProjectForm";
import { getApiErrorMessage } from "../../../shared/api/client";
import { routes } from "../../../shared/routes/paths";

function formatDate(value: string | null): string {
  return value || "-";
}

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

export default function ProfilePage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeProjectModal, setActiveProjectModal] = useState<"create" | "edit" | "delete" | null>(
    null
  );
  const currentUserQuery = useCurrentUser();
  const profileQuery = useMyProfileQuery();
  const profileAttributesQuery = useMyProfileAttributesQuery();
  const projectsQuery = useMyProjectsQuery();
  const attributesQuery = useAttributesQuery({
    page: 1,
    pageSize: 100
  });
  const createProjectMutation = useCreateMyProjectMutation();
  const projects = projectsQuery.data ?? [];
  const selectedProject = useMemo<CandidateProject | null>(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );
  const updateProjectMutation = useUpdateMyProjectMutation(selectedProject?.id ?? "");
  const projectFormInitialValues = useMemo(
    () => projectToFormValues(activeProjectModal === "edit" ? selectedProject : null),
    [activeProjectModal, selectedProject]
  );
  const loadError =
    profileQuery.error ??
    profileAttributesQuery.error ??
    projectsQuery.error ??
    attributesQuery.error;
  const isInitialLoading =
    profileQuery.isLoading ||
    profileAttributesQuery.isLoading ||
    projectsQuery.isLoading ||
    attributesQuery.isLoading;

  function closeProjectFormModal() {
    createProjectMutation.reset();
    updateProjectMutation.reset();
    setActiveProjectModal(null);
  }

  function handleCreateProject(payload: CreateProjectPayload) {
    createProjectMutation.mutate(payload, {
      onSuccess: closeProjectFormModal
    });
  }

  function handleUpdateProject(payload: CreateProjectPayload) {
    if (!selectedProject) {
      return;
    }

    updateProjectMutation.mutate(
      {
        ...payload,
        version: selectedProject.version
      },
      {
        onSuccess: closeProjectFormModal
      }
    );
  }

  if (currentUserQuery.data?.authenticated === false) {
    return (
      <section className="profile-page">
        <Alert variant="warning" className="mb-0">
          Sign in is required to manage your profile. <Link to={routes.signIn}>Sign in</Link>
        </Alert>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <Stack gap={4}>
        <div className="profile-page__header">
          <div>
            <h1 className="h3 mb-1">Candidate Profile</h1>
            <p className="text-secondary mb-0">
              Manage profile details, attributes, and project history.
            </p>
          </div>
          {profileQuery.isFetching ||
          profileAttributesQuery.isFetching ||
          projectsQuery.isFetching ? (
            <Badge bg="secondary">Updating</Badge>
          ) : null}
        </div>

        {loadError ? (
          <Alert variant="danger" className="mb-0 error-message">
            {getApiErrorMessage(loadError)}
          </Alert>
        ) : null}

        {isInitialLoading ? (
          <div className="profile-loading">
            <Spinner animation="border" role="status" />
            <span>Loading profile</span>
          </div>
        ) : null}

        {!isInitialLoading && profileQuery.data ? (
          <section className="profile-section">
            <div className="profile-section__heading">
              <h2 className="h5 mb-0">Profile info</h2>
              <span className="text-secondary">
                Updated {formatDateTime(profileQuery.data.updatedAt)}
              </span>
            </div>
            <ProfileBasicForm profile={profileQuery.data} />
          </section>
        ) : null}

        {!isInitialLoading ? (
          <section className="profile-section">
            <div className="profile-section__heading">
              <h2 className="h5 mb-0">Attribute values</h2>
              <span className="text-secondary">
                {(attributesQuery.data?.items.length ?? 0).toString()} available
              </span>
            </div>
            <ProfileAttributeEditor
              attributes={attributesQuery.data?.items ?? []}
              values={profileAttributesQuery.data ?? []}
            />
          </section>
        ) : null}

        {!isInitialLoading ? (
          <section className="profile-section">
            <div className="profile-section__heading">
              <h2 className="h5 mb-0">Projects</h2>
              <span className="text-secondary">{projects.length} total</span>
            </div>

            <div className="profile-toolbar">
              <ButtonGroup>
                <Button type="button" onClick={() => setActiveProjectModal("create")}>
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline-primary"
                  disabled={!selectedProject}
                  onClick={() => setActiveProjectModal("edit")}
                >
                  Edit selected
                </Button>
                <Button
                  type="button"
                  variant="outline-danger"
                  disabled={!selectedProject}
                  onClick={() => setActiveProjectModal("delete")}
                >
                  Delete selected
                </Button>
              </ButtonGroup>
            </div>

            <div className="table-responsive profile-project-table-wrap">
              <Table hover className="align-middle profile-project-table">
                <thead>
                  <tr>
                    <th scope="col" className="profile-project-table__select">
                      Select
                    </th>
                    <th scope="col">Title</th>
                    <th scope="col">Role</th>
                    <th scope="col">Dates</th>
                    <th scope="col">Current</th>
                    <th scope="col">Tags</th>
                    <th scope="col">Version</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const isSelected = project.id === selectedProjectId;

                    return (
                      <tr
                        key={project.id}
                        className={
                          isSelected
                            ? "table-active profile-project-table__row"
                            : "profile-project-table__row"
                        }
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <td>
                          <Form.Check
                            type="radio"
                            name="selectedProject"
                            aria-label={`Select ${project.title}`}
                            checked={isSelected}
                            readOnly
                          />
                        </td>
                        <td className="fw-semibold">{project.title}</td>
                        <td>{project.role || "-"}</td>
                        <td>
                          {formatDate(project.startDate)} -{" "}
                          {project.isCurrent ? "Present" : formatDate(project.endDate)}
                        </td>
                        <td>{project.isCurrent ? "Yes" : "No"}</td>
                        <td>
                          <div className="profile-tag-list">
                            {project.tags.length > 0
                              ? project.tags.map((tag) => (
                                  <Badge key={tag.id} bg="light" text="dark">
                                    {tag.name}
                                  </Badge>
                                ))
                              : "-"}
                          </div>
                        </td>
                        <td>{project.version}</td>
                        <td>{formatDateTime(project.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {projects.length === 0 ? (
                <div className="profile-empty-state">No projects yet.</div>
              ) : null}
            </div>
          </section>
        ) : null}
      </Stack>

      <Modal
        show={activeProjectModal === "create" || activeProjectModal === "edit"}
        onHide={closeProjectFormModal}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {activeProjectModal === "edit" ? "Edit project" : "Create project"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProfileProjectForm
            initialValues={projectFormInitialValues}
            errorMessage={
              activeProjectModal === "edit"
                ? updateProjectMutation.error
                  ? getApiErrorMessage(updateProjectMutation.error)
                  : null
                : createProjectMutation.error
                  ? getApiErrorMessage(createProjectMutation.error)
                  : null
            }
            isSubmitting={
              activeProjectModal === "edit"
                ? updateProjectMutation.isPending
                : createProjectMutation.isPending
            }
            submitLabel={activeProjectModal === "edit" ? "Save" : "Create"}
            onSubmit={activeProjectModal === "edit" ? handleUpdateProject : handleCreateProject}
          />
        </Modal.Body>
      </Modal>

      <DeleteProjectModal
        show={activeProjectModal === "delete"}
        project={selectedProject}
        onDeleted={() => setSelectedProjectId(null)}
        onHide={() => setActiveProjectModal(null)}
      />
    </section>
  );
}
