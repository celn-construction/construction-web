# SRC Components Reference

Generated on 2026-02-13.

This document catalogs every file under `src/components` with export surface and direct importers from source files.

## Summary by Domain

| Domain | Files |
|---|---|
| `bryntum` | 1 |
| `dashboard` | 4 |
| `documents` | 3 |
| `layout` | 8 |
| `onboarding` | 8 |
| `projects` | 3 |
| `providers` | 2 |
| `team` | 4 |
| `ui` | 10 |

## Domain: `bryntum`

### `src/components/bryntum/BryntumGanttWrapper.tsx`
- Mode: `client`
- Default Export: `BryntumGanttWrapper`
- Named Exports: -
- Direct Consumers (0): _none in `src`_


## Domain: `dashboard`

### `src/components/dashboard/GanttLoadingAnimation.tsx`
- Mode: `client`
- Default Export: `GanttLoadingAnimation`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/dashboard/loading.tsx`

### `src/components/dashboard/ProjectsList.tsx`
- Mode: `client`
- Default Export: `ProjectsList`
- Named Exports: -
- Direct Consumers (0): _none in `src`_

### `src/components/dashboard/StatsCards.tsx`
- Mode: `client`
- Default Export: `StatsCards`
- Named Exports: -
- Direct Consumers (0): _none in `src`_

### `src/components/dashboard/TeamActivity.tsx`
- Mode: `client`
- Default Export: `TeamActivity`
- Named Exports: -
- Direct Consumers (0): _none in `src`_


## Domain: `documents`

### `src/components/documents/DocumentList.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `DocumentList`
- Direct Consumers (1): `src/components/projects/ProjectDetailPanel.tsx`

### `src/components/documents/DocumentTree.tsx`
- Mode: `client`
- Default Export: `DocumentTree`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/documents/page.tsx`

### `src/components/documents/FileDropzone.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `FileDropzoneProps`, `FileDropzone`
- Direct Consumers (1): `src/components/projects/ProjectDetailPanel.tsx`


## Domain: `layout`

### `src/components/layout/Header.tsx`
- Mode: `client`
- Default Export: `Header`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/layout.tsx`

### `src/components/layout/MobileDrawer.tsx`
- Mode: `client`
- Default Export: `MobileDrawer`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/layout.tsx`

### `src/components/layout/MobileHeader.tsx`
- Mode: `client`
- Default Export: `MobileHeader`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/layout.tsx`

### `src/components/layout/navItems.ts`
- Mode: `server/default`
- Default Export: `-`
- Named Exports: `NavItem`, `navItems`
- Direct Consumers (2): `src/components/layout/MobileDrawer.tsx`, `src/components/layout/Sidebar.tsx`

### `src/components/layout/OrgSwitcher.tsx`
- Mode: `client`
- Default Export: `OrgSwitcher`
- Named Exports: -
- Direct Consumers (2): `src/components/layout/MobileDrawer.tsx`, `src/components/layout/Sidebar.tsx`

### `src/components/layout/PageHeader.tsx`
- Mode: `server/default`
- Default Export: `PageHeader`
- Named Exports: -
- Direct Consumers (0): _none in `src`_

### `src/components/layout/Sidebar.tsx`
- Mode: `client`
- Default Export: `Sidebar`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/layout.tsx`

### `src/components/layout/UserMenu.tsx`
- Mode: `client`
- Default Export: `UserMenu`
- Named Exports: -
- Direct Consumers (1): `src/components/layout/Header.tsx`


## Domain: `onboarding`

### `src/components/onboarding/BlueprintBackground.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `BlueprintBackground`
- Direct Consumers (2): `src/app/(onboarding)/layout.tsx`, `src/app/invite/[token]/page.tsx`

### `src/components/onboarding/OnboardingField.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `OnboardingField`
- Direct Consumers (3): `src/components/onboarding/steps/StepContact.tsx`, `src/components/onboarding/steps/StepIdentity.tsx`, `src/components/onboarding/steps/StepReview.tsx`

### `src/components/onboarding/OnboardingProgress.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `OnboardingProgress`
- Direct Consumers (2): `src/components/onboarding/OnboardingWizard.tsx`, `src/components/onboarding/OnboardingWizardV2.tsx`

### `src/components/onboarding/OnboardingWizard.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `OnboardingWizard`
- Direct Consumers (1): `src/app/(onboarding)/onboarding/page.tsx`

### `src/components/onboarding/OnboardingWizardV2.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `OnboardingWizardV2`
- Direct Consumers (0): _none in `src`_

### `src/components/onboarding/steps/StepContact.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `StepContact`
- Direct Consumers (1): `src/components/onboarding/OnboardingWizard.tsx`

### `src/components/onboarding/steps/StepIdentity.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `StepIdentity`
- Direct Consumers (1): `src/components/onboarding/OnboardingWizard.tsx`

### `src/components/onboarding/steps/StepReview.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `StepReview`
- Direct Consumers (1): `src/components/onboarding/OnboardingWizard.tsx`


## Domain: `projects`

### `src/components/projects/AddProjectDialog.tsx`
- Mode: `client`
- Default Export: `AddProjectDialog`
- Named Exports: -
- Direct Consumers (2): `src/app/(app)/dashboard/page.tsx`, `src/components/layout/Header.tsx`

### `src/components/projects/ProjectDetailPanel.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `Selection`, `ProjectDetailPanel`
- Direct Consumers (1): `src/app/(app)/projects/page.tsx`

### `src/components/projects/ProjectsTree.tsx`
- Mode: `client`
- Default Export: `ProjectsTree`
- Named Exports: `folderData`, `Selection`
- Direct Consumers (1): `src/app/(app)/projects/page.tsx`


## Domain: `providers`

### `src/components/providers/LoadingProvider.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `useLoading`, `LoadingProvider`
- Direct Consumers (1): `src/app/layout.tsx`

### `src/components/providers/ThemeRegistry.tsx`
- Mode: `client`
- Default Export: `ThemeRegistry`
- Named Exports: -
- Direct Consumers (1): `src/app/layout.tsx`


## Domain: `team`

### `src/components/team/InviteDialog.tsx`
- Mode: `client`
- Default Export: `InviteDialog`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/team/page.tsx`

### `src/components/team/MembersList.tsx`
- Mode: `client`
- Default Export: `MembersList`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/team/page.tsx`

### `src/components/team/PendingInvitesList.tsx`
- Mode: `client`
- Default Export: `PendingInvitesList`
- Named Exports: -
- Direct Consumers (1): `src/app/(app)/team/page.tsx`

### `src/components/team/RoleSelect.tsx`
- Mode: `client`
- Default Export: `RoleSelect`
- Named Exports: -
- Direct Consumers (1): `src/components/team/InviteDialog.tsx`


## Domain: `ui`

### `src/components/ui/button.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `ButtonProps`
- Direct Consumers (3): `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/app/(auth)/sign-in/page.tsx`

### `src/components/ui/context-menu.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: -
- Direct Consumers (0): _none in `src`_

### `src/components/ui/dropdown-menu.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: -
- Direct Consumers (0): _none in `src`_

### `src/components/ui/image-dropzone.tsx`
- Mode: `client`
- Default Export: `ImageDropzone`
- Named Exports: `ImageDropzoneProps`, `ImageDropzone`
- Direct Consumers (1): `src/components/projects/ProjectDetailPanel.tsx`

### `src/components/ui/image-with-fallback.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `ImageWithFallback`
- Direct Consumers (3): `src/components/dashboard/ProjectsList.tsx`, `src/components/layout/MobileHeader.tsx`, `src/components/layout/UserMenu.tsx`

### `src/components/ui/label.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: -
- Direct Consumers (0): _none in `src`_

### `src/components/ui/loading-spinner.tsx`
- Mode: `client`
- Default Export: `LoadingSpinner`
- Named Exports: -
- Direct Consumers (3): `src/app/loading.tsx`, `src/components/layout/UserMenu.tsx`, `src/components/providers/LoadingProvider.tsx`

### `src/components/ui/Logo.tsx`
- Mode: `server/default`
- Default Export: `-`
- Named Exports: `LogoIcon`, `Logo`
- Direct Consumers (11): `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/app/invite/[token]/page.tsx`, `src/app/page.tsx`, `src/components/layout/MobileDrawer.tsx`, `src/components/layout/MobileHeader.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/onboarding/OnboardingWizard.tsx`, `src/components/onboarding/OnboardingWizardV2.tsx`

### `src/components/ui/optimized-image.tsx`
- Mode: `client`
- Default Export: `-`
- Named Exports: `OptimizedImage`, `HeroImage`
- Direct Consumers (1): `src/app/page.tsx`

### `src/components/ui/sheet.tsx`
- Mode: `server/default`
- Default Export: `-`
- Named Exports: -
- Direct Consumers (0): _none in `src`_

## Components With No Direct Imports in `src`

- `src/components/bryntum/BryntumGanttWrapper.tsx`
- `src/components/dashboard/ProjectsList.tsx`
- `src/components/dashboard/StatsCards.tsx`
- `src/components/dashboard/TeamActivity.tsx`
- `src/components/layout/PageHeader.tsx`
- `src/components/onboarding/OnboardingWizardV2.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/sheet.tsx`
