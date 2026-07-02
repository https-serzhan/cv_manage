import { Form } from "react-bootstrap";

export function GlobalSearch() {
  return (
    <Form role="search" className="global-search">
      <Form.Control
        type="search"
        placeholder="Search candidates, vacancies, CVs..."
        aria-label="Global search"
      />
    </Form>
  );
}
