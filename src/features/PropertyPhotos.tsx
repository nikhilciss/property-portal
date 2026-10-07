import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import type { Property, Photo } from '../types';
import { portal, usePortal } from '../app/context';
export function PropertyPhotos({ property }: { property: Property }) {
  const { user, act } = usePortal();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);
  return (
    <section className="listing-photos">
      <h3>Listing photos</h3>
      <p>
        Add marketing images for the demonstration. Only filenames, captions and file metadata
        persist.
      </p>
      <label className="upload-zone">
        <Camera size={20} />
        Choose property photos
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) => {
            const added: Photo[] = [];
            const next = { ...previews };
            for (const file of Array.from(e.target.files || [])) {
              if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                act(() => {
                  throw Error('Choose JPG or PNG images up to 5 MB.');
                });
                continue;
              }
              const id = crypto.randomUUID();
              added.push({ id, name: file.name, size: file.size, type: file.type, caption: '' });
              next[id] = URL.createObjectURL(file);
              urls.current.push(next[id]);
            }
            if (
              added.length &&
              act(
                () =>
                  portal.updateProperty(user!, property.id, {
                    photos: [...(property.photos || []), ...added],
                  }),
                'Listing photo metadata saved',
              )
            )
              setPreviews(next);
          }}
        />
      </label>
      <div className="photo-grid">
        {property.photos?.map((photo) => (
          <div className="photo-card" key={photo.id}>
            {previews[photo.id] ? (
              <img src={previews[photo.id]} alt={photo.caption || photo.name} />
            ) : (
              <div className="photo-placeholder">
                <Camera />
                <small>{photo.name}</small>
                <small>Metadata only · reselect to preview</small>
              </div>
            )}
            <label>
              Photo caption
              <input
                value={photo.caption}
                onChange={(e) =>
                  act(
                    () =>
                      portal.updateProperty(user!, property.id, {
                        photos: property.photos?.map((p) =>
                          p.id === photo.id ? { ...p, caption: e.target.value } : p,
                        ),
                      }),
                    '',
                  )
                }
              />
            </label>
            <button
              type="button"
              onClick={() =>
                act(
                  () =>
                    portal.updateProperty(user!, property.id, {
                      photos: property.photos?.filter((p) => p.id !== photo.id),
                    }),
                  'Photo removed',
                )
              }
            >
              Remove photo
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
