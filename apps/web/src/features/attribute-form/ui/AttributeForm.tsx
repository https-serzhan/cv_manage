import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Alert, Button, Form, Stack } from "react-bootstrap";

import type {
  AttributeCategory,
  AttributeType,
  CreateAttributePayload,
  UpdateAttributePayload
} from "../../../entities/attribute/model/types";
import { attributeTypes } from "../../../entities/attribute/model/types";

export type AttributeFormValues = Omit<UpdateAttributePayload, "version">;

type AttributeFormProps = {
  categories: AttributeCategory[];
  initialValues: AttributeFormValues;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: AttributeFormValues) => void;
};

function toPayload(values: AttributeFormValues): CreateAttributePayload {
  const options =
    values.type === "DROPDOWN"
      ? values.options?.map((option) => option.trim()).filter(Boolean)
      : undefined;

  return {
    categoryId: values.categoryId,
    name: values.name.trim(),
    description: values.description?.trim() || null,
    type: values.type,
    options
  };
}

export function AttributeForm({
  categories,
  initialValues,
  errorMessage,
  isSubmitting,
  submitLabel,
  onSubmit
}: AttributeFormProps) {
  const [values, setValues] = useState<AttributeFormValues>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function updateField<TKey extends keyof AttributeFormValues>(
    key: TKey,
    value: AttributeFormValues[TKey]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value
    }));
  }

  function updateType(type: AttributeType) {
    setValues((currentValues) => ({
      ...currentValues,
      type,
      options:
        type === "DROPDOWN" ? (currentValues.options?.length ? currentValues.options : [""]) : []
    }));
  }

  function updateOption(index: number, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      options: currentValues.options?.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    }));
  }

  function addOption() {
    setValues((currentValues) => ({
      ...currentValues,
      options: [...(currentValues.options ?? []), ""]
    }));
  }

  function removeOption(index: number) {
    setValues((currentValues) => ({
      ...currentValues,
      options: currentValues.options?.filter((_option, optionIndex) => optionIndex !== index) ?? []
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toPayload(values));
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Stack gap={3}>
        {errorMessage ? (
          <Alert variant="danger" className="mb-0 error-message">
            {errorMessage}
          </Alert>
        ) : null}

        <Form.Group controlId="attribute-category">
          <Form.Label>Category</Form.Label>
          <Form.Select
            value={values.categoryId}
            required
            onChange={(event) => updateField("categoryId", event.currentTarget.value)}
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="attribute-name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={values.name}
            required
            maxLength={120}
            onChange={(event) => updateField("name", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="attribute-description">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={values.description ?? ""}
            onChange={(event) => updateField("description", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="attribute-type">
          <Form.Label>Type</Form.Label>
          <Form.Select
            value={values.type}
            required
            onChange={(event) => updateType(event.currentTarget.value as AttributeType)}
          >
            {attributeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {values.type === "DROPDOWN" ? (
          <Form.Group>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <Form.Label className="mb-0">Options</Form.Label>
              <Button type="button" variant="outline-secondary" size="sm" onClick={addOption}>
                Add option
              </Button>
            </div>
            <Stack gap={2}>
              {(values.options ?? []).map((option, index) => (
                <div key={index} className="attribute-option-row">
                  <Form.Control
                    value={option}
                    placeholder={`Option ${index + 1}`}
                    onChange={(event) => updateOption(index, event.currentTarget.value)}
                  />
                  <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </Stack>
          </Form.Group>
        ) : null}

        <div className="d-flex justify-content-end">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </Stack>
    </Form>
  );
}
