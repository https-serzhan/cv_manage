import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Form, Stack } from "react-bootstrap";

import type { Attribute } from "../../../entities/attribute/model/types";
import type {
  ProfileAttributeValue,
  UpdateProfileAttributeValuePayload
} from "../../../entities/profile/model/types";
import { useUpdateMyProfileAttributeValueMutation } from "../../../entities/profile/model/queries";
import { getApiErrorMessage } from "../../../shared/api/client";

type ProfileAttributeEditorProps = {
  attributes: Attribute[];
  values: ProfileAttributeValue[];
};

type AttributeDraft = {
  stringValue: string;
  textValue: string;
  imageUrl: string;
  numericValue: string;
  dateValue: string;
  periodStart: string;
  periodEnd: string;
  booleanValue: "" | "true" | "false";
  selectedOptionId: string;
};

function toDraft(value: ProfileAttributeValue | null): AttributeDraft {
  return {
    stringValue: value?.stringValue ?? "",
    textValue: value?.textValue ?? "",
    imageUrl: value?.imageUrl ?? "",
    numericValue: value?.numericValue ?? "",
    dateValue: value?.dateValue ?? "",
    periodStart: value?.periodStart ?? "",
    periodEnd: value?.periodEnd ?? "",
    booleanValue: value?.booleanValue == null ? "" : value.booleanValue ? "true" : "false",
    selectedOptionId: value?.selectedOption?.id ?? ""
  };
}

function optionalText(value: string): string | null {
  const normalized = value.trim();

  return normalized ? normalized : null;
}

function toPayload(
  attribute: Attribute,
  draft: AttributeDraft,
  value: ProfileAttributeValue | null
): UpdateProfileAttributeValuePayload {
  const payload: UpdateProfileAttributeValuePayload = {};

  if (attribute.type === "STRING") {
    payload.stringValue = optionalText(draft.stringValue);
  }

  if (attribute.type === "TEXT") {
    payload.textValue = optionalText(draft.textValue);
  }

  if (attribute.type === "IMAGE") {
    payload.imageUrl = optionalText(draft.imageUrl);
  }

  if (attribute.type === "NUMERIC") {
    payload.numericValue = optionalText(draft.numericValue);
  }

  if (attribute.type === "DATE") {
    payload.dateValue = optionalText(draft.dateValue);
  }

  if (attribute.type === "PERIOD") {
    payload.periodStart = optionalText(draft.periodStart);
    payload.periodEnd = optionalText(draft.periodEnd);
  }

  if (attribute.type === "BOOLEAN") {
    payload.booleanValue = draft.booleanValue === "" ? null : draft.booleanValue === "true";
  }

  if (attribute.type === "DROPDOWN") {
    payload.selectedOptionId = optionalText(draft.selectedOptionId);
  }

  if (value) {
    payload.version = value.version;
  }

  return payload;
}

function formatValue(attribute: Attribute, value: ProfileAttributeValue | null): string {
  if (!value) {
    return "Not filled";
  }

  if (attribute.type === "STRING") {
    return value.stringValue || "Not filled";
  }

  if (attribute.type === "TEXT") {
    return value.textValue || "Not filled";
  }

  if (attribute.type === "IMAGE") {
    return value.imageUrl || "Not filled";
  }

  if (attribute.type === "NUMERIC") {
    return value.numericValue || "Not filled";
  }

  if (attribute.type === "DATE") {
    return value.dateValue || "Not filled";
  }

  if (attribute.type === "PERIOD") {
    return [value.periodStart, value.periodEnd].filter(Boolean).join(" - ") || "Not filled";
  }

  if (attribute.type === "BOOLEAN") {
    return value.booleanValue == null ? "Not filled" : value.booleanValue ? "Yes" : "No";
  }

  return value.selectedOption?.value ?? "Not filled";
}

function AttributeValueForm({
  attribute,
  value
}: {
  attribute: Attribute;
  value: ProfileAttributeValue | null;
}) {
  const [draft, setDraft] = useState<AttributeDraft>(() => toDraft(value));
  const [saved, setSaved] = useState(false);
  const updateMutation = useUpdateMyProfileAttributeValueMutation();

  useEffect(() => {
    setDraft(toDraft(value));
    setSaved(false);
  }, [value]);

  function updateField<TKey extends keyof AttributeDraft>(
    key: TKey,
    fieldValue: AttributeDraft[TKey]
  ) {
    setSaved(false);
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: fieldValue
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate(
      {
        attributeId: attribute.id,
        payload: toPayload(attribute, draft, value)
      },
      {
        onSuccess: () => {
          setSaved(true);
        }
      }
    );
  }

  return (
    <Form className="profile-attribute-editor__item" onSubmit={handleSubmit}>
      <Stack gap={3}>
        <div className="profile-attribute-editor__heading">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h3 className="h6 mb-0">{attribute.name}</h3>
              <Badge bg="secondary">{attribute.type}</Badge>
              <Badge bg="light" text="dark">
                {attribute.category.name}
              </Badge>
            </div>
            {attribute.description ? (
              <p className="text-secondary mb-0 mt-1">{attribute.description}</p>
            ) : null}
          </div>
          <span className="text-secondary profile-attribute-editor__current">
            {formatValue(attribute, value)}
          </span>
        </div>

        {updateMutation.error ? (
          <Alert variant="danger" className="mb-0 error-message">
            {getApiErrorMessage(updateMutation.error)}
          </Alert>
        ) : null}
        {saved ? (
          <Alert variant="success" className="mb-0">
            Attribute saved.
          </Alert>
        ) : null}

        {attribute.type === "STRING" ? (
          <Form.Control
            value={draft.stringValue}
            onChange={(event) => updateField("stringValue", event.currentTarget.value)}
          />
        ) : null}

        {attribute.type === "TEXT" ? (
          <Form.Control
            as="textarea"
            rows={3}
            value={draft.textValue}
            onChange={(event) => updateField("textValue", event.currentTarget.value)}
          />
        ) : null}

        {attribute.type === "IMAGE" ? (
          <Form.Control
            type="url"
            value={draft.imageUrl}
            placeholder="https://example.com/image.jpg"
            onChange={(event) => updateField("imageUrl", event.currentTarget.value)}
          />
        ) : null}

        {attribute.type === "NUMERIC" ? (
          <Form.Control
            inputMode="decimal"
            value={draft.numericValue}
            onChange={(event) => updateField("numericValue", event.currentTarget.value)}
          />
        ) : null}

        {attribute.type === "DATE" ? (
          <Form.Control
            type="date"
            value={draft.dateValue}
            onChange={(event) => updateField("dateValue", event.currentTarget.value)}
          />
        ) : null}

        {attribute.type === "PERIOD" ? (
          <div className="profile-period-fields">
            <Form.Group controlId={`period-start-${attribute.id}`}>
              <Form.Label>Start</Form.Label>
              <Form.Control
                type="date"
                value={draft.periodStart}
                onChange={(event) => updateField("periodStart", event.currentTarget.value)}
              />
            </Form.Group>
            <Form.Group controlId={`period-end-${attribute.id}`}>
              <Form.Label>End</Form.Label>
              <Form.Control
                type="date"
                value={draft.periodEnd}
                onChange={(event) => updateField("periodEnd", event.currentTarget.value)}
              />
            </Form.Group>
          </div>
        ) : null}

        {attribute.type === "BOOLEAN" ? (
          <Form.Select
            value={draft.booleanValue}
            onChange={(event) =>
              updateField("booleanValue", event.currentTarget.value as "" | "true" | "false")
            }
          >
            <option value="">Not filled</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Form.Select>
        ) : null}

        {attribute.type === "DROPDOWN" ? (
          <Form.Select
            value={draft.selectedOptionId}
            onChange={(event) => updateField("selectedOptionId", event.currentTarget.value)}
          >
            <option value="">Select option</option>
            {attribute.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.value}
              </option>
            ))}
          </Form.Select>
        ) : null}

        <div className="profile-section__footer">
          <span className="text-secondary">{value ? `Version ${value.version}` : "New value"}</span>
          <Button type="submit" disabled={updateMutation.isPending}>
            Save value
          </Button>
        </div>
      </Stack>
    </Form>
  );
}

export function ProfileAttributeEditor({ attributes, values }: ProfileAttributeEditorProps) {
  const valueByAttributeId = useMemo(
    () => new Map(values.map((value) => [value.attribute.id, value])),
    [values]
  );

  if (attributes.length === 0) {
    return <div className="profile-empty-state">No attributes are available.</div>;
  }

  return (
    <Stack gap={3}>
      {attributes.map((attribute) => (
        <AttributeValueForm
          key={attribute.id}
          attribute={attribute}
          value={valueByAttributeId.get(attribute.id) ?? null}
        />
      ))}
    </Stack>
  );
}
