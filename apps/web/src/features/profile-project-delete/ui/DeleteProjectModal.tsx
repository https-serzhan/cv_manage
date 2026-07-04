import { Alert, Button, Modal, Stack } from "react-bootstrap";

import type { CandidateProject } from "../../../entities/profile/model/types";
import { useDeleteMyProjectMutation } from "../../../entities/profile/model/queries";
import { getApiErrorMessage } from "../../../shared/api/client";

type DeleteProjectModalProps = {
  show: boolean;
  project: CandidateProject | null;
  onDeleted: () => void;
  onHide: () => void;
};

export function DeleteProjectModal({ show, project, onDeleted, onHide }: DeleteProjectModalProps) {
  const deleteMutation = useDeleteMyProjectMutation();

  function handleHide() {
    deleteMutation.reset();
    onHide();
  }

  function handleDelete() {
    if (!project) {
      return;
    }

    deleteMutation.mutate(
      {
        projectId: project.id,
        version: project.version
      },
      {
        onSuccess: () => {
          onDeleted();
          handleHide();
        }
      }
    );
  }

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack gap={3}>
          {deleteMutation.error ? (
            <Alert variant="danger" className="mb-0 error-message">
              {getApiErrorMessage(deleteMutation.error)}
            </Alert>
          ) : null}

          {project ? (
            <p className="mb-0">
              Delete <strong>{project.title}</strong>? This action cannot be undone.
            </p>
          ) : (
            <Alert variant="warning" className="mb-0">
              Select a project before deleting.
            </Alert>
          )}
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="outline-secondary" onClick={handleHide}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!project || deleteMutation.isPending}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
