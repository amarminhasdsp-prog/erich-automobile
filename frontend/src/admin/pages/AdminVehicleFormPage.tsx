import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAdminVehicle,
  deleteAdminDocument,
  deleteAdminPhoto,
  fetchAdminVehicle,
  setAdminMainPhoto,
  updateAdminVehicle,
  uploadAdminDocument,
  uploadAdminPhotos,
} from '../api/adminClient';
import { buildPhotoUrl, fetchDealers } from '../../api/client';
import type { Dealer, DocumentType, Vehicle, VehicleCategory, ConditionType, VehicleStatus, FuelType, TransmissionType } from '../../types/vehicle';
import {
  categoryLabels,
  conditionLabels,
  documentTypeLabels,
  fuelTypeLabels,
  statusLabels,
  transmissionLabels,
} from '../../utils/labels';
import ErrorState from '../../components/ErrorState';
import { StarIcon, TrashIcon, UploadIcon } from '../../components/icons';

const inputClass =
  'w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-2.5 text-sm text-paper placeholder:text-paper/40 transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper/55';

interface FormState {
  dealerId: string;
  make: string;
  model: string;
  variant: string;
  category: VehicleCategory | '';
  condition: ConditionType | '';
  status: VehicleStatus;
  price: string;
  vatDeductible: boolean;
  firstRegistration: string;
  mileageKm: string;
  powerKw: string;
  powerHp: string;
  fuelType: FuelType | '';
  transmission: TransmissionType | '';
  cubicCapacity: string;
  exteriorColor: string;
  interiorColor: string;
  features: string;
  title: string;
  description: string;
  locationCity: string;
  locationPostalCode: string;
  vin: string;
}

const EMPTY_FORM: FormState = {
  dealerId: '',
  make: '',
  model: '',
  variant: '',
  category: '',
  condition: '',
  status: 'ENTWURF',
  price: '',
  vatDeductible: false,
  firstRegistration: '',
  mileageKm: '',
  powerKw: '',
  powerHp: '',
  fuelType: '',
  transmission: '',
  cubicCapacity: '',
  exteriorColor: '',
  interiorColor: '',
  features: '',
  title: '',
  description: '',
  locationCity: '',
  locationPostalCode: '',
  vin: '',
};

function vehicleToForm(v: Vehicle): FormState {
  return {
    dealerId: v.dealerId,
    make: v.make,
    model: v.model,
    variant: v.variant ?? '',
    category: v.category,
    condition: v.condition,
    status: v.status,
    price: String(v.price / 100),
    vatDeductible: v.vatDeductible,
    firstRegistration: v.firstRegistration.slice(0, 10),
    mileageKm: String(v.mileageKm),
    powerKw: String(v.powerKw),
    powerHp: String(v.powerHp),
    fuelType: v.fuelType,
    transmission: v.transmission,
    cubicCapacity: v.cubicCapacity ? String(v.cubicCapacity) : '',
    exteriorColor: v.exteriorColor ?? '',
    interiorColor: v.interiorColor ?? '',
    features: v.features ?? '',
    title: v.title,
    description: v.description,
    locationCity: v.locationCity ?? '',
    locationPostalCode: v.locationPostalCode ?? '',
    vin: v.vin ?? '',
  };
}

/** Anlegen/Bearbeiten eines Inserats inkl. Foto- und Dokumentverwaltung. */
export default function AdminVehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('SONSTIGES');

  useEffect(() => {
    fetchDealers()
      .then((list) => {
        setDealers(list);
        if (!isEditMode && list[0]) {
          setForm((f) => ({ ...f, dealerId: list[0].id }));
        }
      })
      .catch(() => setDealers([]));
  }, [isEditMode]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchAdminVehicle(id)
      .then((v) => {
        setVehicle(v);
        setForm(vehicleToForm(v));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Fahrzeug konnte nicht geladen werden'))
      .finally(() => setIsLoading(false));
  }, [id]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        dealerId: form.dealerId,
        make: form.make,
        model: form.model,
        variant: form.variant || undefined,
        category: form.category as VehicleCategory,
        condition: form.condition as ConditionType,
        status: form.status,
        price: Math.round(Number(form.price) * 100),
        vatDeductible: form.vatDeductible,
        firstRegistration: form.firstRegistration,
        mileageKm: Number(form.mileageKm),
        powerKw: Number(form.powerKw),
        powerHp: Number(form.powerHp),
        fuelType: form.fuelType as FuelType,
        transmission: form.transmission as TransmissionType,
        cubicCapacity: form.cubicCapacity ? Number(form.cubicCapacity) : undefined,
        exteriorColor: form.exteriorColor || undefined,
        interiorColor: form.interiorColor || undefined,
        features: form.features || undefined,
        title: form.title,
        description: form.description,
        locationCity: form.locationCity || undefined,
        locationPostalCode: form.locationPostalCode || undefined,
        vin: form.vin || undefined,
      };

      if (isEditMode && id) {
        const updated = await updateAdminVehicle(id, payload);
        setVehicle(updated);
        window.alert('Änderungen gespeichert.');
      } else {
        const created = await createAdminVehicle(payload as never);
        navigate(`/admin/fahrzeuge/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePhotoUpload() {
    if (!vehicle || !photoFiles || photoFiles.length === 0) return;
    setError(null);
    try {
      await uploadAdminPhotos(vehicle.id, Array.from(photoFiles));
      const refreshed = await fetchAdminVehicle(vehicle.id);
      setVehicle(refreshed);
      setPhotoFiles(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Foto-Upload fehlgeschlagen');
    }
  }

  async function handleSetMainPhoto(photoId: string) {
    if (!vehicle) return;
    await setAdminMainPhoto(vehicle.id, photoId);
    setVehicle(await fetchAdminVehicle(vehicle.id));
  }

  async function handleDeletePhoto(photoId: string) {
    if (!vehicle) return;
    if (!window.confirm('Foto wirklich löschen?')) return;
    await deleteAdminPhoto(vehicle.id, photoId);
    setVehicle(await fetchAdminVehicle(vehicle.id));
  }

  async function handleDocumentUpload() {
    if (!vehicle || !documentFile) return;
    setError(null);
    try {
      await uploadAdminDocument(vehicle.id, documentFile, documentType);
      setVehicle(await fetchAdminVehicle(vehicle.id));
      setDocumentFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dokument-Upload fehlgeschlagen');
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!vehicle) return;
    if (!window.confirm('Dokument wirklich löschen?')) return;
    await deleteAdminDocument(vehicle.id, documentId);
    setVehicle(await fetchAdminVehicle(vehicle.id));
  }

  if (isLoading) {
    return <div className="shimmer h-96 w-full rounded-2xl" />;
  }

  if (error && isEditMode && !vehicle) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
        {isEditMode ? 'Inserat bearbeiten' : 'Neues Inserat'}
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-paper">
        {isEditMode ? form.title || 'Inserat bearbeiten' : 'Neues Fahrzeug anlegen'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="sr-only">Grunddaten</legend>

          <div>
            <label className={labelClass} htmlFor="f-make">
              Marke
            </label>
            <input
              id="f-make"
              required
              value={form.make}
              onChange={(e) => update('make', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-model">
              Modell
            </label>
            <input
              id="f-model"
              required
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-variant">
              Ausstattungslinie
            </label>
            <input
              id="f-variant"
              value={form.variant}
              onChange={(e) => update('variant', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-dealer">
              Händler
            </label>
            <select
              id="f-dealer"
              required
              value={form.dealerId}
              onChange={(e) => update('dealerId', e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="f-category">
              Kategorie
            </label>
            <select
              id="f-category"
              required
              value={form.category}
              onChange={(e) => update('category', e.target.value as VehicleCategory)}
              className={selectClass}
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="f-condition">
              Zustand
            </label>
            <select
              id="f-condition"
              required
              value={form.condition}
              onChange={(e) => update('condition', e.target.value as ConditionType)}
              className={selectClass}
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              {Object.entries(conditionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="f-status">
              Status
            </label>
            <select
              id="f-status"
              required
              value={form.status}
              onChange={(e) => update('status', e.target.value as VehicleStatus)}
              className={selectClass}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-paper/45">
              „Entwurf“ ist nur hier im Verwaltungsbereich sichtbar, nicht auf der öffentlichen Seite.
            </p>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/85">
              <input
                type="checkbox"
                checked={form.vatDeductible}
                onChange={(e) => update('vatDeductible', e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-brass"
              />
              MwSt. ausweisbar
            </label>
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <legend className="mb-2 font-display text-base font-semibold text-paper">Preis &amp; Technik</legend>
          <div>
            <label className={labelClass} htmlFor="f-price">
              Preis (EUR)
            </label>
            <input
              id="f-price"
              type="number"
              min="0"
              step="1"
              required
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-registration">
              Erstzulassung
            </label>
            <input
              id="f-registration"
              type="date"
              required
              value={form.firstRegistration}
              onChange={(e) => update('firstRegistration', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-mileage">
              Kilometerstand
            </label>
            <input
              id="f-mileage"
              type="number"
              min="0"
              required
              value={form.mileageKm}
              onChange={(e) => update('mileageKm', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-kw">
              Leistung (kW)
            </label>
            <input
              id="f-kw"
              type="number"
              min="0"
              required
              value={form.powerKw}
              onChange={(e) => update('powerKw', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-hp">
              Leistung (PS)
            </label>
            <input
              id="f-hp"
              type="number"
              min="0"
              required
              value={form.powerHp}
              onChange={(e) => update('powerHp', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-cubic">
              Hubraum (ccm)
            </label>
            <input
              id="f-cubic"
              type="number"
              min="0"
              value={form.cubicCapacity}
              onChange={(e) => update('cubicCapacity', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-fuel">
              Kraftstoff
            </label>
            <select
              id="f-fuel"
              required
              value={form.fuelType}
              onChange={(e) => update('fuelType', e.target.value as FuelType)}
              className={selectClass}
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              {Object.entries(fuelTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="f-transmission">
              Getriebe
            </label>
            <select
              id="f-transmission"
              required
              value={form.transmission}
              onChange={(e) => update('transmission', e.target.value as TransmissionType)}
              className={selectClass}
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              {Object.entries(transmissionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="f-vin">
              Fahrgestellnummer
            </label>
            <input id="f-vin" value={form.vin} onChange={(e) => update('vin', e.target.value)} className={inputClass} />
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-display text-base font-semibold text-paper">Optik &amp; Standort</legend>
          <div>
            <label className={labelClass} htmlFor="f-ext-color">
              Farbe außen
            </label>
            <input
              id="f-ext-color"
              value={form.exteriorColor}
              onChange={(e) => update('exteriorColor', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-int-color">
              Farbe innen
            </label>
            <input
              id="f-int-color"
              value={form.interiorColor}
              onChange={(e) => update('interiorColor', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-city">
              Standort (Stadt)
            </label>
            <input
              id="f-city"
              value={form.locationCity}
              onChange={(e) => update('locationCity', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-postal">
              Postleitzahl
            </label>
            <input
              id="f-postal"
              value={form.locationPostalCode}
              onChange={(e) => update('locationPostalCode', e.target.value)}
              className={inputClass}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-display text-base font-semibold text-paper">Beschreibung</legend>
          <div className="mb-4">
            <label className={labelClass} htmlFor="f-title">
              Anzeigetitel
            </label>
            <input
              id="f-title"
              required
              maxLength={150}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="mb-4">
            <label className={labelClass} htmlFor="f-description">
              Beschreibungstext
            </label>
            <textarea
              id="f-description"
              required
              rows={5}
              maxLength={5000}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-features">
              Ausstattung (kommagetrennt)
            </label>
            <input
              id="f-features"
              value={form.features}
              onChange={(e) => update('features', e.target.value)}
              placeholder="Klimaautomatik, Navigationssystem, Sitzheizung"
              className={inputClass}
            />
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-300">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-graphite-700/60 pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer rounded-xl bg-brass px-6 py-3 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Speichert…' : isEditMode ? 'Änderungen speichern' : 'Inserat anlegen'}
          </button>
          {!isEditMode && (
            <p className="text-xs text-paper/50">
              Fotos und Dokumente können nach dem Anlegen ergänzt werden.
            </p>
          )}
        </div>
      </form>

      {isEditMode && vehicle && (
        <>
          <section className="mt-10 border-t border-graphite-700/60 pt-8">
            <h2 className="font-display text-lg font-semibold text-paper">Fotos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {vehicle.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-graphite-700/60"
                >
                  <img src={buildPhotoUrl(photo.filename)} alt="" className="h-full w-full object-cover" />
                  {photo.isMain && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brass px-2 py-0.5 text-[10px] font-semibold text-graphite-950">
                      <StarIcon className="h-3 w-3" />
                      Hauptbild
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-graphite-950/0 p-2 opacity-0 transition-opacity duration-200 group-hover:bg-graphite-950/50 group-hover:opacity-100">
                    {!photo.isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(photo.id)}
                        aria-label="Als Hauptbild setzen"
                        className="flex cursor-pointer items-center justify-center rounded-full bg-graphite-900/90 p-1.5 text-paper transition-colors duration-200 hover:text-brass"
                      >
                        <StarIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      aria-label="Foto löschen"
                      className="flex cursor-pointer items-center justify-center rounded-full bg-graphite-900/90 p-1.5 text-paper transition-colors duration-200 hover:text-red-300"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className={labelClass} htmlFor="f-photos" aria-hidden="true" />
              <input
                id="f-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => setPhotoFiles(e.target.files)}
                className="text-sm text-paper/70"
              />
              <button
                type="button"
                onClick={handlePhotoUpload}
                disabled={!photoFiles || photoFiles.length === 0}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-brass px-4 py-2 text-sm font-semibold text-brass transition-colors duration-200 hover:bg-brass hover:text-graphite-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UploadIcon className="h-4 w-4" />
                Fotos hochladen
              </button>
            </div>
          </section>

          <section className="mt-10 border-t border-graphite-700/60 pt-8">
            <h2 className="font-display text-lg font-semibold text-paper">Dokumente</h2>
            <ul className="mt-4 space-y-2">
              {(vehicle.documents ?? []).map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-graphite-700/60 bg-graphite-900/30 px-4 py-2.5 text-sm"
                >
                  <span className="text-paper/85">
                    {documentTypeLabels[doc.type]} — <span className="text-paper/50">{doc.originalName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id)}
                    aria-label={`${doc.originalName} löschen`}
                    className="cursor-pointer text-paper/50 transition-colors duration-200 hover:text-red-300"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {(vehicle.documents ?? []).length === 0 && (
                <p className="text-sm text-paper/45">Noch keine Dokumente hochgeladen.</p>
              )}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className={selectClass + ' w-auto'}
                aria-label="Dokumenttyp"
              >
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                className="text-sm text-paper/70"
              />
              <button
                type="button"
                onClick={handleDocumentUpload}
                disabled={!documentFile}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-brass px-4 py-2 text-sm font-semibold text-brass transition-colors duration-200 hover:bg-brass hover:text-graphite-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UploadIcon className="h-4 w-4" />
                Dokument hochladen
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
