import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Form,
  Modal,
  Spinner,
  Stack,
  Table
} from "react-bootstrap";

import {
  useAdminUserQuery,
  useAdminUsersQuery,
  useUpdateAdminUserRolesMutation
} from "../../../entities/admin-user/model/queries";
import type {
  AdminRoleCode,
  AdminUser,
  GetAdminUsersParams
} from "../../../entities/admin-user/model/types";
import { adminRoleCodes } from "../../../entities/admin-user/model/types";
import { getApiErrorMessage } from "../../../shared/api/client";

const pageSizeOptions = [10, 20, 50] as const;

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function RoleBadges({ roles }: { roles: Array<{ code: AdminRoleCode; name: string }> }) {
  return (
    <div className="profile-tag-list">
      {roles.map((role) => (
        <Badge bg={role.code === "ADMIN" ? "dark" : "secondary"} key={role.code}>
          {role.code}
        </Badge>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<GetAdminUsersParams>({
    page: 1,
    pageSize: 20
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const usersQuery = useAdminUsersQuery(filters);
  const selectedUserQuery = useAdminUserQuery(selectedUserId ?? "", Boolean(selectedUserId));
  const updateRolesMutation = useUpdateAdminUserRolesMutation();

  const users = usersQuery.data?.items ?? [];
  const pagination = usersQuery.data?.pagination;
  const selectedUserFromList = useMemo<AdminUser | null>(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );
  const selectedUser = selectedUserQuery.data ?? selectedUserFromList;
  const currentPage = pagination?.page ?? filters.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  useEffect(() => {
    if (selectedUserId && !users.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(null);
      setRolesModalOpen(false);
    }
  }, [selectedUserId, users]);

  function applyFilters(nextFilters: Partial<GetAdminUsersParams>) {
    setSelectedUserId(null);
    setRolesModalOpen(false);
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
      pageSize: nextFilters.pageSize ?? current.pageSize ?? 20
    }));
  }

  function resetFilters() {
    setSelectedUserId(null);
    setRolesModalOpen(false);
    setFilters({
      page: 1,
      pageSize: 20
    });
  }

  async function updateUserRoles(userId: string, roles: AdminRoleCode[]) {
    await updateRolesMutation.mutateAsync({
      id: userId,
      payload: { roles }
    });
    setRolesModalOpen(false);
  }

  const isInitialLoading = usersQuery.isLoading && !usersQuery.data;

  return (
    <section className="page-section">
      <Stack gap={4}>
        <div className="profile-page__header">
          <div>
            <h1 className="h3 mb-1">Admin Users</h1>
            <p className="text-secondary mb-0">View users and manage platform roles.</p>
          </div>
          {usersQuery.isFetching && !isInitialLoading ? (
            <Badge bg="secondary">Updating</Badge>
          ) : null}
        </div>

        {usersQuery.isError ? (
          <Alert variant="danger" className="mb-0 error-message">
            {getApiErrorMessage(usersQuery.error)}
          </Alert>
        ) : null}

        <section className="profile-section">
          <div className="profile-section__heading">
            <h2 className="h5 mb-0">Filters</h2>
          </div>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <Form.Label>Search</Form.Label>
              <Form.Control
                value={filters.prefix ?? ""}
                placeholder="Name or email"
                onChange={(event) => applyFilters({ prefix: event.currentTarget.value })}
              />
            </div>
            <div className="col-md-4">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={filters.role ?? ""}
                onChange={(event) =>
                  applyFilters({
                    role: (event.currentTarget.value || undefined) as AdminRoleCode | undefined
                  })
                }
              >
                <option value="">All roles</option>
                {adminRoleCodes.map((roleCode) => (
                  <option key={roleCode} value={roleCode}>
                    {roleCode}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-3">
              <Button className="w-100" variant="outline-secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </section>

        <div className="profile-toolbar">
          <div>
            <strong>User actions</strong>
            <div className="text-muted small">
              {selectedUser
                ? `Selected: ${selectedUser.displayName}`
                : "Select a row to edit roles."}
            </div>
          </div>
          <ButtonGroup>
            <Button
              variant="outline-primary"
              disabled={!selectedUser}
              onClick={() => setRolesModalOpen(true)}
            >
              Edit roles selected
            </Button>
          </ButtonGroup>
        </div>

        {isInitialLoading ? (
          <div className="profile-loading">
            <Spinner animation="border" role="status" />
            <span>Loading users</span>
          </div>
        ) : null}

        {!isInitialLoading && !usersQuery.isError ? (
          <div className="table-responsive profile-project-table-wrap">
            <Table hover className="align-middle profile-project-table">
              <thead>
                <tr>
                  <th scope="col" className="profile-project-table__select">
                    Select
                  </th>
                  <th scope="col">Display name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Roles</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelected = user.id === selectedUserId;

                  return (
                    <tr
                      className={
                        isSelected
                          ? "table-active profile-project-table__row"
                          : "profile-project-table__row"
                      }
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedUserId(user.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedUserId(user.id);
                        }
                      }}
                    >
                      <td>
                        <Form.Check
                          type="radio"
                          name="selectedAdminUser"
                          aria-label={`Select ${user.displayName}`}
                          checked={isSelected}
                          readOnly
                        />
                      </td>
                      <td className="fw-semibold">{user.displayName}</td>
                      <td>{user.email}</td>
                      <td>
                        <RoleBadges roles={user.roles} />
                      </td>
                      <td>{formatDateTime(user.createdAt)}</td>
                      <td>{formatDateTime(user.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            {users.length === 0 ? <div className="profile-empty-state">No users found.</div> : null}
          </div>
        ) : null}

        {pagination ? (
          <div className="attribute-pagination">
            <div className="text-secondary">
              Page {pagination.page} of {pagination.totalPages || 1}, {pagination.total} total
            </div>
            <div className="attribute-pagination__controls">
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ page: currentPage - 1 })}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters({ page: currentPage + 1 })}
              >
                Next
              </Button>
              <Form.Select
                size="sm"
                className="attribute-pagination__page-size"
                value={filters.pageSize ?? 20}
                onChange={(event) =>
                  applyFilters({
                    page: 1,
                    pageSize: Number(event.currentTarget.value)
                  })
                }
              >
                {pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize} rows
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        ) : null}
      </Stack>

      <EditRolesModal
        error={updateRolesMutation.error}
        isSubmitting={updateRolesMutation.isPending}
        open={rolesModalOpen}
        user={selectedUser}
        onClose={() => {
          updateRolesMutation.reset();
          setRolesModalOpen(false);
        }}
        onSubmit={updateUserRoles}
      />
    </section>
  );
}

function EditRolesModal({
  error,
  isSubmitting,
  open,
  user,
  onClose,
  onSubmit
}: {
  error: unknown;
  isSubmitting: boolean;
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSubmit: (userId: string, roles: AdminRoleCode[]) => Promise<void>;
}) {
  const [selectedRoles, setSelectedRoles] = useState<AdminRoleCode[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedRoles(user?.roles.map((role) => role.code) ?? []);
    setLocalError(null);
  }, [open, user]);

  function toggleRole(roleCode: AdminRoleCode) {
    setSelectedRoles((current) => {
      if (current.includes(roleCode)) {
        return current.filter((code) => code !== roleCode);
      }

      return [...current, roleCode];
    });
  }

  async function submit() {
    if (!user) {
      return;
    }

    if (selectedRoles.length === 0) {
      setLocalError("Select at least one role.");
      return;
    }

    setLocalError(null);
    await onSubmit(user.id, selectedRoles);
  }

  return (
    <Modal show={open} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit roles</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {user ? (
          <div className="mb-3">
            <div className="fw-semibold">{user.displayName}</div>
            <div className="text-muted">{user.email}</div>
          </div>
        ) : null}

        <Stack gap={2}>
          {adminRoleCodes.map((roleCode) => (
            <Form.Check
              checked={selectedRoles.includes(roleCode)}
              key={roleCode}
              label={roleCode}
              type="checkbox"
              onChange={() => toggleRole(roleCode)}
            />
          ))}
        </Stack>

        {localError ? (
          <Alert variant="warning" className="mt-3 mb-0">
            {localError}
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="danger" className="mt-3 mb-0 error-message">
            {getApiErrorMessage(error)}
          </Alert>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!user || isSubmitting} onClick={submit}>
          {isSubmitting ? "Saving..." : "Save roles"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
