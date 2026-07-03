import { useMemo } from "react";
import { Modal } from "react-bootstrap";

import type { AttributeCategory } from "../../../entities/attribute/model/types";
import { useCreateAttributeMutation } from "../../../entities/attribute/model/queries";
import { getApiErrorMessage } from "../../../shared/api/client";
import { AttributeForm, type AttributeFormValues } from "../../attribute-form/ui/AttributeForm";

type CreateAttributeModalProps = {
  show: boolean;
  categories: AttributeCategory[];
  onHide: () => void;
};

export function CreateAttributeModal({ show, categories, onHide }: CreateAttributeModalProps) {
  const createMutation = useCreateAttributeMutation();
  const initialValues = useMemo<AttributeFormValues>(
    () => ({
      categoryId: categories[0]?.id ?? "",
      name: "",
      description: null,
      type: "STRING",
      options: []
    }),
    [categories]
  );

  function handleHide() {
    createMutation.reset();
    onHide();
  }

  function handleSubmit(values: AttributeFormValues) {
    createMutation.mutate(values, {
      onSuccess: handleHide
    });
  }

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create attribute</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AttributeForm
          categories={categories}
          initialValues={initialValues}
          errorMessage={createMutation.error ? getApiErrorMessage(createMutation.error) : null}
          isSubmitting={createMutation.isPending}
          submitLabel="Create"
          onSubmit={handleSubmit}
        />
      </Modal.Body>
    </Modal>
  );
}
