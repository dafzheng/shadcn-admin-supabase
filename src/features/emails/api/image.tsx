import axios from "axios";


export interface ImageItem {
  path: string;
  url: string; // public or signed URL
}


export interface ImagesResp {
  bucket: string;
  count: number;
  prefix?: string;
  signed: boolean;
  expiresIn?: number;
  items: ImageItem[];
}

export async function uploadImage(file: File | Blob, folder?: string) {
  const form = new FormData();
  form.append('file', file);

  const qs = new URLSearchParams();
  if (folder) qs.set('folder', folder);

  const resp = await fetch(`/api/images/upload?${qs.toString()}`, {
    method: 'POST',
    body: form,
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Upload failed: ${resp.status} ${msg}`);
  }
  const data = (await resp.json());
  return data;
}

export async function listImages(opts?: { prefix?: string; signed?: boolean; expires?: number }) {
  const { data } = await axios.get<ImagesResp>('/api/images/list', {
    params: {
      prefix: opts?.prefix,
      signed: opts?.signed,
      expires: opts?.expires,
    },
  });
  return data;
}


export async function deleteImage(path: string) {
  const { data } = await axios.delete('/api/image', { params: { path } });
  return data as { bucket: string; deleted: Array<{ name: string }> };
}
