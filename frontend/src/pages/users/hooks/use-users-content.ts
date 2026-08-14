import { createUser, getUser, getUsers, updateUser } from "@/services/users";
import type { CreateUserDto, UpdateUserDto, UsersListParams } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from '@/constants/query-keys.constants';


/**
 * Hook to search for users
 */
export const useUsersSearchQuery = (params: UsersListParams) => {
    return useQuery({
        queryKey: QUERY_KEYS.users.search(params),
        queryFn: () => getUsers(params),
    });
};

/**
 * Hook to get a single user by ID
 */
export const useUserByUserIdQuery = (id: number, enabled: boolean = true) => {
    return useQuery({
        queryKey: QUERY_KEYS.users.detail(id),
        queryFn: () => getUser(id),
        enabled: enabled && !!id && !Number.isNaN(id),
    });
};

/**
 * Hook to create a new user (POST /api/users, CreateUserDto)
 */
export const useCreateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateUserDto) => createUser(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.lists() });
        },
        onError: (error) => {
            console.error('Error creating user:', error);
        },
    });
};

/**
 * Hook to update a user (PATCH /api/users/:id, UpdateUserDto)
 */
export const useUpdateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateUserDto) => updateUser(body.id, body),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.lists() });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.detail(variables.id) });
        },
        onError: (error) => {
            console.error('Error updating user:', error);
        },
    });
};
