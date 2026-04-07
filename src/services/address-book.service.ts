import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type {
  AddressBook, AddressBookForm, AddressBookQuery,
  Tag, TagForm,
  AddressBookCollection, AddressBookCollectionForm,
  AddressBookCollectionRule, AddressBookCollectionRuleForm,
} from '@/types/address-book'

// Address Book Entries
export function getAddressBooks(params: AddressBookQuery) {
  return apiGet<PaginatedData<AddressBook>>('/api/admin/address_book/list', params as Record<string, unknown>)
}

export function createAddressBook(data: AddressBookForm) {
  return apiPost('/api/admin/address_book/create', data)
}

export function updateAddressBook(data: AddressBookForm) {
  return apiPost('/api/admin/address_book/update', data)
}

export function deleteAddressBook(rowId: number) {
  return apiPost('/api/admin/address_book/delete', { row_id: rowId })
}

// Tags
export function getTags(params?: { page?: number; page_size?: number; user_id?: number; collection_id?: number }) {
  return apiGet<PaginatedData<Tag>>('/api/admin/tag/list', { page: 1, page_size: 1000, ...params } as Record<string, unknown>)
}

export function createTag(data: TagForm) {
  return apiPost('/api/admin/tag/create', data)
}

export function updateTag(data: TagForm) {
  return apiPost('/api/admin/tag/update', data)
}

export function deleteTag(id: number) {
  return apiPost('/api/admin/tag/delete', { id })
}

// Collections
export function getCollections(params?: { page?: number; page_size?: number; user_id?: number }) {
  return apiGet<PaginatedData<AddressBookCollection>>('/api/admin/address_book_collection/list', { page: 1, page_size: 1000, ...params } as Record<string, unknown>)
}

export function createCollection(data: AddressBookCollectionForm) {
  return apiPost('/api/admin/address_book_collection/create', data)
}

export function updateCollection(data: AddressBookCollectionForm) {
  return apiPost('/api/admin/address_book_collection/update', data)
}

export function deleteCollection(id: number) {
  return apiPost('/api/admin/address_book_collection/delete', { id })
}

// Collection Rules
export function getCollectionRules(params?: { page?: number; page_size?: number; user_id?: number; collection_id?: number }) {
  return apiGet<PaginatedData<AddressBookCollectionRule>>('/api/admin/address_book_collection_rule/list', { page: 1, page_size: 1000, ...params } as Record<string, unknown>)
}

export function createCollectionRule(data: AddressBookCollectionRuleForm) {
  return apiPost('/api/admin/address_book_collection_rule/create', data)
}

export function updateCollectionRule(data: AddressBookCollectionRuleForm) {
  return apiPost('/api/admin/address_book_collection_rule/update', data)
}

export function deleteCollectionRule(id: number) {
  return apiPost('/api/admin/address_book_collection_rule/delete', { id })
}
