-- Consolidate roles to owner/admin/member.
-- project_manager rows -> admin (preserve their working capability:
--   create projects, manage projects, approve documents).
-- viewer rows -> member (functionally the same view-only access).
--
-- Roles are stored as plain String columns, so this is a pure data migration.

UPDATE "Membership"    SET "role" = 'admin'  WHERE "role" = 'project_manager';
UPDATE "Membership"    SET "role" = 'member' WHERE "role" = 'viewer';

UPDATE "Invitation"    SET "role" = 'admin'  WHERE "role" = 'project_manager';
UPDATE "Invitation"    SET "role" = 'member' WHERE "role" = 'viewer';

UPDATE "ProjectMember" SET "role" = 'admin'  WHERE "role" = 'project_manager';
UPDATE "ProjectMember" SET "role" = 'member' WHERE "role" = 'viewer';
