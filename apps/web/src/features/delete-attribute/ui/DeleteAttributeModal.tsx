import { Alert, Button, Modal, Stack } from "react-bootstrap";

import type { Attribute } from "../../../entities/attribute/model/types";
import { useDeleteAttributeMutation } from "../../../entities/attribute/model/queries";
import { getApiErrorMessage } from "../../../shared/api/client";

type DeleteAttributeModalProps = {
  show: boolean;
  attribute: Attribute | null;
  onDeleted: () => void;
  onHide: () => void;
};

export function DeleteAttributeModal({
  show,
  attribute,
  onDeleted,
  onHide
}: DeleteAttributeModalProps) {
  const deleteMutation = useDeleteAttributeMutation();

  function handleHide() {
    deleteMutation.reset();
    onHide();
  }

  function handleDelete() {
    if (!attribute) {
      return;
    }

    deleteMutation.mutate(
      {
        id: attribute.id,
        version: attribute.version
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
        <Modal.Title>Delete attribute</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack gap={3}>
          {deleteMutation.error ? (
            <Alert variant="danger" className="mb-0 error-message">
              {getApiErrorMessage(deleteMutation.error)}
            </Alert>
          ) : null}

          {attribute ? (
            <p className="mb-0">
              Delete <strong>{attribute.name}</strong>? This action cannot be undone.
            </p>
          ) : (
            <Alert variant="warning" className="mb-0">
              Select an attribute before deleting.
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
          disabled={!attribute || deleteMutation.isPending}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
