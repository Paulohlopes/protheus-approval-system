import { backendApi } from './api';

export interface ApprovalGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: ApprovalGroupMember[];
  _count?: {
    members: number;
  };
}

export interface ApprovalGroupMember {
  id: string;
  groupId: string;
  userId: string;
  addedAt: string;
  addedById?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    username: string;
    department?: string;
    isActive?: boolean;
  };
  group?: {
    id: string;
    name: string;
  };
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const approvalGroupService = {
  // ==========================================
  // GROUP OPERATIONS
  // ==========================================

  /**
   * Get all approval groups
   */
  async getGroups(includeInactive = false): Promise<ApprovalGroup[]> {
    const response = await backendApi.get('/approval-groups', {
      params: { includeInactive },
    });
    return response.data;
  },

  /**
   * Get a specific approval group by ID
   */
  async getGroup(id: string): Promise<ApprovalGroup> {
    const response = await backendApi.get(`/approval-groups/${id}`);
    return response.data;
  },

  /**
   * Create a new approval group
   */
  async createGroup(data: CreateGroupDto): Promise<ApprovalGroup> {
    const response = await backendApi.post('/approval-groups', data);
    return response.data;
  },

  /**
   * Update an approval group
   */
  async updateGroup(id: string, data: UpdateGroupDto): Promise<ApprovalGroup> {
    const response = await backendApi.put(`/approval-groups/${id}`, data);
    return response.data;
  },

  /**
   * Delete (deactivate) an approval group
   */
  async deleteGroup(id: string): Promise<ApprovalGroup> {
    const response = await backendApi.delete(`/approval-groups/${id}`);
    return response.data;
  },

  // ==========================================
  // MEMBER OPERATIONS
  // ==========================================

  /**
   * Get all members of a group
   */
  async getMembers(groupId: string): Promise<ApprovalGroupMember[]> {
    const response = await backendApi.get(`/approval-groups/${groupId}/members`);
    return response.data;
  },

  /**
   * Add a member to a group
   */
  async addMember(groupId: string, userId: string): Promise<ApprovalGroupMember> {
    const response = await backendApi.post(`/approval-groups/${groupId}/members`, { userId });
    return response.data;
  },

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await backendApi.delete(`/approval-groups/${groupId}/members/${userId}`);
  },

  // ==========================================
  // UTILITY OPERATIONS
  // ==========================================

  /**
   * Get groups that the current user belongs to
   */
  async getMyGroups(): Promise<ApprovalGroupMember[]> {
    const response = await backendApi.get('/approval-groups/user/my-groups');
    return response.data;
  },

  /**
   * Get groups that a specific user belongs to
   */
  async getUserGroups(userId: string): Promise<ApprovalGroupMember[]> {
    const response = await backendApi.get(`/approval-groups/user/${userId}/groups`);
    return response.data;
  },
};
