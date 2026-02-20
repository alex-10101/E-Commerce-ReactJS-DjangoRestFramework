import type { IUser } from "../../types/types";
import { apiSlice } from "../apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCSRFCookie: builder.mutation<string, void>({
      query: () => ({
        url: "/auth/csrf_cookie/",
        method: "GET",
      }),
    }),

    checkUserIsAuthenticated: builder.mutation<{ user: IUser }, void>({
      query: () => ({
        url: "/auth/is_authenticated/",
        method: "GET",
      }),
    }),

    registerUser: builder.mutation<
      string,
      {
        username: string;
        email: string;
        password: string;
        confirmPassword: string;
      }
    >({
      query: (body) => ({
        url: "/auth/register/",
        method: "POST",
        body,
      }),
    }),

    activateAccoumt: builder.mutation<string, { uid: string; token: string }>({
      query: ({ uid, token }) => ({
        url: `/auth/activate_account/${uid}/${token}/`,
        method: "POST",
      }),
    }),

    loginUser: builder.mutation<
      { user: IUser }, // the object is required, because the "setCredentials" reducer expects a "user" key: PayloadAction<{ user: IUser }>
      { email: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/login/",
        method: "POST",
        body,
      }),
    }),

    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout/",
        method: "POST",
      }),
    }),

    logoutUserAllDevices: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout_all/",
        method: "POST",
      }),
    }),

    changeKnownPassword: builder.mutation<
      void,
      {
        oldPassword: string;
        newPassword: string;
        newPasswordConfirm: string;
      }
    >({
      query: (body) => ({
        url: "/auth/change_known_password/",
        method: "PUT",
        body,
      }),
    }),

    requestChangeForgottenPassword: builder.mutation<string, { email: string }>(
      {
        query: (body) => ({
          url: `/auth/request_change_known_password/`,
          method: "POST",
          body,
        }),
      },
    ),

    confirmChangeForgottenPassword: builder.mutation<
      string,
      {
        uid: string;
        token: string;
        newPassword: string;
        newPasswordConfirm: string;
      }
    >({
      query: (body) => ({
        url: `/auth/confirm_change_known_password/${body.uid}/${body.token}/`,
        method: "PUT",
        body,
      }),
    }),

    getUsers: builder.query<IUser[], void>({
      query: () => ({
        url: "/auth/get_all_acounts/",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "users", id }) as const),
              { type: "users", id: "LIST" },
            ]
          : [{ type: "users", id: "LIST" }],
    }),

    getUserDetails: builder.query<IUser, number>({
      query: (id) => ({
        url: `/auth/get_acount/${id}/`,
      }),
      providesTags: (_result, _error, id) => [{ type: "users", id }],
    }),

    updateUser: builder.mutation<
      IUser, // the object is required, because the "setCredentials" reducer expects a "user" key: PayloadAction<{ user: IUser }>
      {
        userId: number;
        is_staff: boolean;
      }
    >({
      query: (body) => ({
        url: `/auth/update_account/${body.userId}/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (res) => [
        { type: "users", id: res?.id },
        { type: "users", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation<void, { password: string }>({
      query: (body) => ({
        url: "/auth/delete_account/",
        method: "DELETE",
        body,
      }),
      // no need for invalidation here, because all state is lost after deleting the user's acount.
    }),

    deleteUserAdmin: builder.mutation<void, number>({
      query: (id) => ({
        url: `/auth/delete_account_admin/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "users", id },
        { type: "users", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCSRFCookieMutation,
  useCheckUserIsAuthenticatedMutation,
  useRegisterUserMutation,
  useActivateAccoumtMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useLogoutUserAllDevicesMutation,
  useRequestChangeForgottenPasswordMutation,
  useConfirmChangeForgottenPasswordMutation,
  useChangeKnownPasswordMutation,
  useGetUsersQuery,
  useGetUserDetailsQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useDeleteUserAdminMutation,
} = authApiSlice;
