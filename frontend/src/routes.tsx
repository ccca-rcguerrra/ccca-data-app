import { createBrowserRouter, Outlet } from 'react-router';
import { ROUTES, toChildPath } from '@/constants/routes.constants';

import { MainLayout } from '@/components/layout/main/layout';
import LoginPage from './pages/auth/login-page';
import ForgotPasswordPage from './pages/auth/forgot-password-page';
import ResetPasswordPage from './pages/auth/reset-password-page';
import { ErrorPage } from './pages/error/error-page';
import ProtectedRoute from './routes/protected-route';
import { IndicatorsPage } from './pages/semaspa/indicators/indicators-page';
import { UsersManagementPage } from './pages/users/management/users-management-page';
import { TeamsManagementPage } from './pages/teams/management/teams-management-page';
import { AutefsListPage } from './pages/semaspa/autefs/autefs-list-page';
import { AutefDetailPage } from './pages/semaspa/autefs/autef-detail-page';
import { ForestGuidesListPage } from './pages/semaspa/forest-guides/forest-guides-list-page';
import { ForestGuideDetailPage } from './pages/semaspa/forest-guides/forest-guide-detail-page';
import { PeopleListPage } from './pages/semaspa/people/people-list-page';
import { PersonDetailPage } from './pages/semaspa/people/person-detail-page';

const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: ROUTES.auth.login,
        element: <LoginPage />,
      },
      {
        path: ROUTES.auth.forgotPassword,
        element: <ForgotPasswordPage />,
      },
      {
        path: ROUTES.auth.resetPassword,
        element: <ResetPasswordPage />,
      },
      {
        path: ROUTES.root,
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <MainLayout>
                <IndicatorsPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.dashboard.root),
            element: (
              <MainLayout>
                <IndicatorsPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.users.root),
            element: (
              <MainLayout>
                <UsersManagementPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.users.list),
            element: (
              <MainLayout>
                <UsersManagementPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.teams.root),
            element: (
              <MainLayout>
                <TeamsManagementPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.teams.list),
            element: (
              <MainLayout>
                <TeamsManagementPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.semaspa.autefs),
            element: (
              <MainLayout>
                <AutefsListPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.semaspa.autefDetail),
            element: (
              <MainLayout>
                <AutefDetailPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.semaspa.forestGuides),
            element: (
              <MainLayout>
                <ForestGuidesListPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.semaspa.forestGuideDetail),
            element: (
              <MainLayout>
                <ForestGuideDetailPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.semaspa.people),
            element: (
              <MainLayout>
                <PeopleListPage />
              </MainLayout>
            ),
          },
          {
            path: toChildPath(ROUTES.semaspa.personDetail),
            element: (
              <MainLayout>
                <PersonDetailPage />
              </MainLayout>
            ),
          },
        ],
      },
    ],
  },
]);

export const routes = router;
