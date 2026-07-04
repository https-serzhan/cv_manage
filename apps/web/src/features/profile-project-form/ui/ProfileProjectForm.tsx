import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Stack } from "react-bootstrap";

import type { CandidateProject, CreateProjectPayload } from "../../../entities/profile/model/types";
import { useProjectTagsQuery } from "../../../entities/profile/model/queries";

export type ProjectFormValues = {
  title: string;
  description: string;
  role: string;
  url: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  tagNamesText: string;
};

type ProfileProjectFormProps = {
  initialValues: ProjectFormValues;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateProjectPayload) => void;
};

export function projectToFormValues(project: CandidateProject | null): ProjectFormValues {
  return {
    title: project?.title ?? "",
    description: project?.description ?? "",
    role: project?.role ?? "",
    url: project?.url ?? "",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    isCurrent: project?.isCurrent ?? false,
    tagNamesText: project?.tags.map((tag) => tag.name).join(", ") ?? ""
  };
}

function optionalText(value: string): string | null {
  const normalized = value.trim();

  return normalized ? normalized : null;
}

function parseTagNames(value: string): string[] {
  const seen = new Set<string>();
  const tagNames: string[] = [];

  for (const tagName of value.split(",")) {
    const normalized = tagName.trim();
    const key = normalized.toLowerCase();

    if (normalized && !seen.has(key)) {
      seen.add(key);
      tagNames.push(normalized);
    }
  }

  return tagNames;
}

function toPayload(values: ProjectFormValues): CreateProjectPayload {
  return {
    title: values.title.trim(),
    description: optionalText(values.description),
    role: optionalText(values.role),
    url: optionalText(values.url),
    startDate: optionalText(values.startDate),
    endDate: values.isCurrent ? null : optionalText(values.endDate),
    isCurrent: values.isCurrent,
    tagNames: parseTagNames(values.tagNamesText)
  };
}

export function ProfileProjectForm({
  initialValues,
  errorMessage,
  isSubmitting,
  submitLabel,
  onSubmit
}: ProfileProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>(initialValues);
  const tagLookupPrefix = useMemo(
    () => values.tagNamesText.split(",").at(-1)?.trim() ?? "",
    [values.tagNamesText]
  );
  const tagSuggestionsQuery = useProjectTagsQuery({
    prefix: tagLookupPrefix || undefined,
    page: 1,
    pageSize: 10
  });

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function updateField<TKey extends keyof ProjectFormValues>(
    key: TKey,
    value: ProjectFormValues[TKey]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value
    }));
  }

  function updateIsCurrent(isCurrent: boolean) {
    setValues((currentValues) => ({
      ...currentValues,
      isCurrent,
      endDate: isCurrent ? "" : currentValues.endDate
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

        <Form.Group controlId="project-title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            value={values.title}
            required
            maxLength={160}
            onChange={(event) => updateField("title", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="project-description">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={values.description}
            onChange={(event) => updateField("description", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="project-role">
          <Form.Label>Role</Form.Label>
          <Form.Control
            value={values.role}
            maxLength={120}
            onChange={(event) => updateField("role", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="project-url">
          <Form.Label>URL</Form.Label>
          <Form.Control
            type="url"
            value={values.url}
            onChange={(event) => updateField("url", event.currentTarget.value)}
          />
        </Form.Group>

        <div className="profile-project-form__dates">
          <Form.Group controlId="project-start-date">
            <Form.Label>Start date</Form.Label>
            <Form.Control
              type="date"
              value={values.startDate}
              onChange={(event) => updateField("startDate", event.currentTarget.value)}
            />
          </Form.Group>
          <Form.Group controlId="project-end-date">
            <Form.Label>End date</Form.Label>
            <Form.Control
              type="date"
              value={values.endDate}
              disabled={values.isCurrent}
              onChange={(event) => updateField("endDate", event.currentTarget.value)}
            />
          </Form.Group>
        </div>

        <Form.Check
          type="checkbox"
          id="project-is-current"
          label="Current project"
          checked={values.isCurrent}
          onChange={(event) => updateIsCurrent(event.currentTarget.checked)}
        />

        <Form.Group controlId="project-tags">
          <Form.Label>Tags</Form.Label>
          <Form.Control
            value={values.tagNamesText}
            list="project-tag-suggestions"
            placeholder="TypeScript, Prisma, Express"
            onChange={(event) => updateField("tagNamesText", event.currentTarget.value)}
          />
          <datalist id="project-tag-suggestions">
            {(tagSuggestionsQuery.data?.items ?? []).map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
        </Form.Group>

        <div className="d-flex justify-content-end">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </Stack>
    </Form>
  );
}
