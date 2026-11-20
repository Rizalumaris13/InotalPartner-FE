import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import schema from '../contracts/aboutEmpowering.schema.json'
import { isAboutEmpoweringRecord, toAboutEmpoweringPayload } from '../utils/aboutEmpowering'

export const ABOUT_EMPOWERING_PATH = schema['x-http'].admin_path

const readResponse = ({ data: body }) => {
  const record = readNullableContent(body, isAboutEmpoweringRecord, 'Format pengaturan Memberdayakan Bisnis tidak sesuai kontrak.')
  return record === null ? null : toAboutEmpoweringPayload(record)
}

export const getPublicAboutEmpoweringApi = (options = {}) =>
  api.get(schema['x-http'].public_path, options).then(readResponse)

export const getAboutEmpoweringApi = (options = {}) =>
  api.get(ABOUT_EMPOWERING_PATH, options).then(readResponse)

export const createAboutEmpoweringApi = (record, options = {}) => {
  if (!isAboutEmpoweringRecord(record)) throw new Error('Isian Memberdayakan Bisnis belum valid.')
  return api.post(ABOUT_EMPOWERING_PATH, toAboutEmpoweringPayload(record), options)
    .then(({ data: body }) => requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan pengaturan.'))
}

export const updateAboutEmpoweringApi = (record, options = {}) => {
  if (!isAboutEmpoweringRecord(record)) throw new Error('Isian Memberdayakan Bisnis belum valid.')
  return api.put(ABOUT_EMPOWERING_PATH, toAboutEmpoweringPayload(record), options)
    .then(({ data: body }) => requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan pengaturan.'))
}

export const deleteAboutEmpoweringApi = (options = {}) =>
  api.delete(ABOUT_EMPOWERING_PATH, options).then((response) => {
    if (response.status !== 204) {
      requireContentAcknowledgement(response.data, 'Backend belum mengonfirmasi penghapusan pengaturan.')
    }
  })
