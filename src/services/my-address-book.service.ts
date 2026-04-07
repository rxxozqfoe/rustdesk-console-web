import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type {
  MyAddressBook, MyAddressBookForm, MyAddressBookQuery,
  MyTag, MyTagForm,
  MyAddressBookCollection, MyAddressBookCollectionForm,
  MyAddressBookCollectionRule, MyAddressBookCollectionRuleForm,
} from '@/types/my-address-book'

// Address Book Entries
export function getMyAddressBooks(params: MyAddressBookQuery) {
  return apiGet<PaginatedData<MyAddressBook>>('/api/admin/my/address_book/list', params as Record<string, unknown>)
}

export function createMyAddressBook(data: MyAddressBookForm) {
  return apiPost('/api/admin/my/address_book/create', data)
}

export function updateMyAddressBook(data: MyAddressBookForm) {
  return apiPost('/api/admin/my/address_book/update', data)
}

export function deleteMyAddressBook(rowId: number) {
  return apiPost('/api/admin/my/address_book/delete', { row_id: rowId })
}

// Tags
export function getMyTags(params?: { page?: number; page_size?: number; collection_id?: number }) {
  return apiGet<PaginatedData<MyTag>>('/api/admin/my/tag/list', { page: 1, page_size: 1000, ...params } as Record<string, unknown>)
}

export function createMyTag(data: MyTagForm) {
  return apiPost('/api/admin/my/tag/create', data)
}

export function updateMyTag(data: MyTagForm) {
  return apiPost('/api/admin/my/tag/update', data)
}

export function deleteMyTag(id: number) {
  return apiPost('/api/admin/my/tag/delete', { id })
}

// Collections
export function getMyCollections(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<MyAddressBookCollection>>('/api/admin/my/address_book_collection/list', { page: 1, page_size: 1000, ...params } as Record<string, unknown>)
}

export function createMyCollection(data: MyAddressBookCollectionForm) {
  return apiPost('/api/admin/my/address_book_collection/create', data)
}

export function updateMyCollection(data: MyAddressBookCollectionForm) {
  return apiPost('/api/admin/my/address_book_collection/update', data)
}

export function deleteMyCollection(id: number) {
  return apiPost('/api/admin/my/address_book_collection/delete', { id })
}

// Collection Rules
export function getMyCollectionRules(params?: { page?: number; page_size?: number; collection_id?: number }) {
  return apiGet<PaginatedData<MyAddressBookCollectionRule>>('/api/admin/my/address_book_collection_rule/list', { page: 1, page_size: 1000, ...params } as Record<string, unknown>)
}

export function createMyCollectionRule(data: MyAddressBookCollectionRuleForm) {
  return apiPost('/api/admin/my/address_book_collection_rule/create', data)
}

export function updateMyCollectionRule(data: MyAddressBookCollectionRuleForm) {
  return apiPost('/api/admin/my/address_book_collection_rule/update', data)
}

export function deleteMyCollectionRule(id: number) {
  return apiPost('/api/admin/my/address_book_collection_rule/delete', { id })
}
