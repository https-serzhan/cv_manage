import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Alert, Button, Form, Stack } from "react-bootstrap";

import type { Profile, UpdateProfilePayload } from "../../../entities/profile/model/types";
import { useUpdateMyProfileMutation } from "../../../entities/profile/model/queries";
import { getApiErrorMessage } from "../../../shared/api/client";

type ProfileBasicFormProps = {
  profile: Profile;
};

type ProfileFormValues = {
  headline: string;
  summary: string;
  location: string;
  avatarImageUrl: string;
};

function toFormValues(profile: Profile): ProfileFormValues {
  return {
    headline: profile.headline ?? "",
    summary: profile.summary ?? "",
    location: profile.location ?? "",
    avatarImageUrl: profile.avatarImageUrl ?? ""
  };
}

function optionalText(value: string): string | null {
  const normalized = value.trim();

  return normalized ? normalized : null;
}

function toPayload(values: ProfileFormValues, version: number): UpdateProfilePayload {
  return {
    headline: optionalText(values.headline),
    summary: optionalText(values.summary),
    location: optionalText(values.location),
    avatarImageUrl: optionalText(values.avatarImageUrl),
    version
  };
}

export function ProfileBasicForm({ profile }: ProfileBasicFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(() => toFormValues(profile));
  const [saved, setSaved] = useState(false);
  const updateMutation = useUpdateMyProfileMutation();

  useEffect(() => {
    setValues(toFormValues(profile));
    setSaved(false);
  }, [profile]);

  function updateField<TKey extends keyof ProfileFormValues>(
    key: TKey,
    value: ProfileFormValues[TKey]
  ) {
    setSaved(false);
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate(toPayload(values, profile.version), {
      onSuccess: () => {
        setSaved(true);
      }
    });
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Stack gap={3}>
        {updateMutation.error ? (
          <Alert variant="danger" className="mb-0 error-message">
            {getApiErrorMessage(updateMutation.error)}
          </Alert>
        ) : null}
        {saved ? (
          <Alert variant="success" className="mb-0">
            Profile saved.
          </Alert>
        ) : null}

        <Form.Group controlId="profile-headline">
          <Form.Label>Headline</Form.Label>
          <Form.Control
            value={values.headline}
            maxLength={160}
            onChange={(event) => updateField("headline", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="profile-summary">
          <Form.Label>Summary</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={values.summary}
            onChange={(event) => updateField("summary", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="profile-location">
          <Form.Label>Location</Form.Label>
          <Form.Control
            value={values.location}
            maxLength={120}
            onChange={(event) => updateField("location", event.currentTarget.value)}
          />
        </Form.Group>

        <Form.Group controlId="profile-avatar">
          <Form.Label>Avatar image URL</Form.Label>
          <Form.Control
            type="url"
            value={values.avatarImageUrl}
            onChange={(event) => updateField("avatarImageUrl", event.currentTarget.value)}
          />
        </Form.Group>

        <div className="profile-section__footer">
          <span className="text-secondary">Version {profile.version}</span>
          <Button type="submit" disabled={updateMutation.isPending}>
            Save profile
          </Button>
        </div>
      </Stack>
    </Form>
  );
}
