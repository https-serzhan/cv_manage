import { useMemo } from "react";
import { Alert, Modal } from "react-bootstrap";

import type { Attribute, AttributeCategory } from "../../../entities/attribute/model/types";
import { useUpdateAttributeMutation } from "../../../entities/attribute/model/queries";
import { getApiErrorMessage } from "../../../shared/api/client";
import { AttributeForm, type AttributeFormValues } from "../../attribute-form/ui/AttributeForm";

type EditAttributeModalProps = {
  show: boolean;
  attribute: Attribute | null;
  categories: AttributeCategory[];
  onHide: () => void;
};

export function EditAttributeModal({
  show,
  attribute,
  categories,
  onHide
}: EditAttributeModalProps) {
  const updateMutation = useUpdateAttributeMutation(attribute?.id ?? "");
  const initialValues = useMemo<AttributeFormValues | null>(() => {
    if (!attribute) {
      return null;
    }

    return {
      categoryId: attribute.category.id,
      name: attribute.name,
      description: attribute.description,
      type: attribute.type,
      options: attribute.options.map((option) => option.value)
    };
  }, [attribute]);

  function handleHide() {
    updateMutation.reset();
    onHide();
  }

  function handleSubmit(values: AttributeFormValues) {
    if (!attribute) {
      return;
    }

    updateMutation.mutate(
      {
        ...values,
        version: attribute.version
      },
      {
        onSuccess: handleHide
      }
    );
  }

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit attribute</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {attribute && initialValues ? (
          <AttributeForm
            categories={categories}
            initialValues={initialValues}
            errorMessage={updateMutation.error ? getApiErrorMessage(updateMutation.error) : null}
            isSubmitting={updateMutation.isPending}
            submitLabel="Save"
            onSubmit={handleSubmit}
          />
        ) : (
          <Alert variant="warning" className="mb-0">
            Select an attribute before editing.
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
}
