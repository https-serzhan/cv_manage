import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";

import type {
  AttributeCategory,
  AttributeType,
  GetAttributesParams
} from "../../../entities/attribute/model/types";
import { attributeTypes } from "../../../entities/attribute/model/types";

type AttributeFiltersProps = {
  categories: AttributeCategory[];
  values: GetAttributesParams;
  onApply: (values: GetAttributesParams) => void;
};

type DraftFilters = {
  prefix: string;
  categoryId: string;
  type: string;
};

function toDraft(values: GetAttributesParams): DraftFilters {
  return {
    prefix: values.prefix ?? "",
    categoryId: values.categoryId ?? "",
    type: values.type ?? ""
  };
}

export function AttributeFilters({ categories, values, onApply }: AttributeFiltersProps) {
  const [draft, setDraft] = useState<DraftFilters>(() => toDraft(values));

  useEffect(() => {
    setDraft(toDraft(values));
  }, [values]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply({
      prefix: draft.prefix.trim() || undefined,
      categoryId: draft.categoryId || undefined,
      type: draft.type ? (draft.type as AttributeType) : undefined,
      page: 1,
      pageSize: values.pageSize
    });
  }

  function handleReset() {
    onApply({
      page: 1,
      pageSize: values.pageSize
    });
  }

  return (
    <Form className="attribute-filters" onSubmit={handleSubmit}>
      <Row className="g-3 align-items-end">
        <Col xs={12} lg={4}>
          <Form.Group controlId="attribute-filter-prefix">
            <Form.Label>Name</Form.Label>
            <Form.Control
              value={draft.prefix}
              placeholder="Search by name"
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  prefix: event.currentTarget.value
                }))
              }
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Form.Group controlId="attribute-filter-category">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={draft.categoryId}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  categoryId: event.currentTarget.value
                }))
              }
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} lg={2}>
          <Form.Group controlId="attribute-filter-type">
            <Form.Label>Type</Form.Label>
            <Form.Select
              value={draft.type}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  type: event.currentTarget.value
                }))
              }
            >
              <option value="">All types</option>
              {attributeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs={12} lg={3}>
          <div className="attribute-filters__actions">
            <Button type="submit" variant="primary">
              Apply
            </Button>
            <Button type="button" variant="outline-secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
}
