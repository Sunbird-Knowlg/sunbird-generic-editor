import { vi } from 'vitest';
import type { EditorController } from '../useEditor';
import type { ContentEditorService } from '../services/ContentEditorService';
import type { ContentData, EditorContext } from '../types';

export const mockContext: EditorContext = {
  uid: 'u1',
  sid: 's1',
  did: 'd1',
  channel: 'ch1',
  pdata: { id: 'sunbird.portal', pid: 'creation-portal', ver: '1.0' },
  user: { id: 'u1', name: 'Tester', rootOrgId: 'org1', roles: ['CONTENT_CREATOR'] },
  framework: 'NCF',
};

export const mockContent: ContentData = {
  identifier: 'do_1',
  name: 'Sample content',
  mimeType: 'application/pdf',
  status: 'Draft',
  artifactUrl: 'https://cdn/do_1/artifact.pdf',
  createdBy: 'u1',
  collaborators: [],
  versionKey: 'vk1',
};

/** A minimal fake ContentEditorService with the methods drawers/modals call. */
export function mockService(over: Record<string, unknown> = {}): ContentEditorService {
  return {
    searchUsers: vi.fn().mockResolvedValue([]),
    searchImageAssets: vi.fn().mockResolvedValue([]),
    uploadImageAsset: vi.fn().mockResolvedValue('https://cdn/img.png'),
    readForm: vi.fn().mockResolvedValue([]),
    readFormFields: vi.fn().mockResolvedValue([]),
    readFramework: vi.fn().mockResolvedValue([]),
    readContent: vi.fn().mockResolvedValue(mockContent),
    createLock: vi.fn().mockResolvedValue({}),
    retireLock: vi.fn().mockResolvedValue(undefined),
    ...over,
  } as unknown as ContentEditorService;
}

/**
 * Build an EditorController stub. Every action is a vi.fn(); pass `over` to
 * override any state or action for the scenario under test.
 */
export function makeEd(over: Partial<EditorController> = {}): EditorController {
  const ed = {
    // state
    content: mockContent,
    view: 'player',
    drawer: null,
    toast: null,
    progress: null,
    contentType: '',
    uploadUrl: '',
    urlError: null,
    busy: false,
    busyAction: null,
    mode: 'edit',
    lang: 'en',
    categories: ['eTextbook', 'Explanation Content', 'Learning Resource'],
    maxMB: 150,
    largeUpload: false,
    headerLogo: '',
    previewUrl: '/content/preview/preview.html',
    previewConfig: { showEndpage: true },
    framework: 'NCF',
    userId: 'u1',
    rootOrgId: 'org1',
    userRoles: ['CONTENT_CREATOR'],
    reviewErrors: [],
    uploadSuccess: false,
    sessionExpired: false,
    assetPicker: null,
    reviewSubmitMode: false,
    hasReviewComments: false,
    // setters
    setDrawer: vi.fn(),
    setContentType: vi.fn(),
    setUploadUrl: vi.fn(),
    setUrlError: vi.fn(),
    showToast: vi.fn(),
    setReviewErrors: vi.fn(),
    setReviewSubmitMode: vi.fn(),
    dismissSessionExpiry: vi.fn(),
    openAssetPicker: vi.fn(),
    closeAssetPicker: vi.fn(),
    // actions
    uploadFile: vi.fn(),
    uploadFromUrl: vi.fn(),
    cancelUpload: vi.fn(),
    saveMetadata: vi.fn(),
    saveMetadataAndSubmit: vi.fn(),
    saveDraft: vi.fn(),
    saveCollaborators: vi.fn().mockResolvedValue(undefined),
    validateForReview: vi.fn().mockReturnValue([]),
    validateForReviewAsync: vi.fn().mockResolvedValue([]),
    sendForReview: vi.fn(),
    publish: vi.fn(),
    requestChanges: vi.fn(),
    close: vi.fn(),
    uploadAsset: undefined,
    // services
    service: mockService(),
    context: mockContext,
    ...over,
  } as unknown as EditorController;
  return ed;
}
