import { http } from './http';

export interface NodeIcon {
  id:        string;
  name:      string;
  label:     string;
  category:  string;
  mimeType:  string;
  createdAt: string;
}

export const iconsApi = {
  /** List all custom uploaded icons */
  list: async (): Promise<NodeIcon[]> => {
    const { data } = await http.get<{ data: NodeIcon[] }>('/api/v1/icons');
    return data.data;
  },

  /** Upload a new icon file (FormData with 'file' + 'name' fields) */
  upload: async (formData: FormData): Promise<NodeIcon> => {
    const { data } = await http.post<NodeIcon>('/api/v1/icons/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Delete a custom icon */
  delete: async (id: string): Promise<void> => {
    await http.delete(`/api/v1/icons/${id}`);
  },

  /** Set the icon key/id on a specific node */
  setNodeIcon: async (nodeId: string, iconKey: string): Promise<void> => {
    await http.put(`/api/v1/topology/nodes/${nodeId}/icon`, { iconKey });
  },
};
