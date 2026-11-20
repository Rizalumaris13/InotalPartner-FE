import { useState } from 'react'
import CompanyForm from '../components/CompanyForm'
import CompanyOpportunityList from '../components/CompanyOpportunityList'
import { COMPANY_MENUS, COMPANY_ROLES } from '../data/companyInputs'
import { emptyCompanyDraft } from '../utils/companyInputs'

const emptyState = () => ({ status: 'list', editingId: null, notice: '' })

export default function CompanyInputPage({ activeNav, role }) {
  const currentRole = typeof role === 'object' ? role?.name : role
  const menu = COMPANY_MENUS.find((item) => item.key === activeNav)
  const [entries, setEntries] = useState({})
  const [views, setViews] = useState({})

  if (!COMPANY_ROLES.includes(currentRole))
    return (
      <p className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Menu perusahaan tidak tersedia untuk akun ini.
      </p>
    )
  if (!menu)
    return (
      <p className="text-sm text-gray-600">
        Pilih jenis peluang perusahaan melalui sidebar.
      </p>
    )

  const view = views[menu.key] || emptyState()
  const list = entries[menu.key] || []
  const editingEntry =
    view.editingId && list.find((entry) => entry.id === view.editingId)

  const updateView = (patch) =>
    setViews((current) => ({
      ...current,
      [menu.key]: { ...(current[menu.key] || emptyState()), ...patch },
    }))

  const openForm = (editingId = null) =>
    updateView({ status: 'form', editingId, notice: '' })

  const backToList = (notice = '') =>
    updateView({ status: 'list', editingId: null, notice })

  const saveEntry = (draft) => {
    setEntries((current) => {
      const currentList = current[menu.key] || []
      const nextList = view.editingId
        ? currentList.map((entry) =>
            entry.id === view.editingId ? { ...entry, draft } : entry,
          )
        : [...currentList, { id: `${menu.key}-${Date.now()}`, draft }]
      return { ...current, [menu.key]: nextList }
    })
    backToList(
      view.editingId
        ? `${menu.label} berhasil diperbarui.`
        : `${menu.label} berhasil ditambahkan.`,
    )
  }

  const deleteEntry = (id) => {
    setEntries((current) => ({
      ...current,
      [menu.key]: (current[menu.key] || []).filter((entry) => entry.id !== id),
    }))
    updateView({
      status: 'list',
      editingId: null,
      notice: `${menu.label} berhasil dihapus.`,
    })
  }

  if (view.status === 'form')
    return (
      <CompanyForm
        // Key memaksa form dimuat ulang saat beralih antara draf baru dan draf yang diedit
        key={view.editingId ?? 'new'}
        menu={menu}
        editing={Boolean(view.editingId)}
        initialDraft={
          editingEntry?.draft
            ? { ...editingEntry.draft }
            : emptyCompanyDraft(menu)
        }
        onSave={saveEntry}
        onCancel={() => backToList()}
      />
    )

  return (
    <CompanyOpportunityList
      menu={menu}
      entries={list}
      notice={view.notice}
      onAdd={() => openForm()}
      onEdit={openForm}
      onDelete={deleteEntry}
    />
  )
}
