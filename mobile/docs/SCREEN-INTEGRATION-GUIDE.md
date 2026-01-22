# 📱 Screen Integration Guide - Pattern End-to-End

## ✅ Screen-uri Integrate Complet (Exemple de Referință)

### 1. **ProfileScreen** - `mobile/src/features/profile/screens/ProfileScreen.tsx`
✅ Integrare completă cu API real

**Pattern aplicat:**
```typescript
// Import hooks
import { useUserProfile } from '@/features/profile/hooks/useUser';

// În component
const { data: apiUser, isLoading } = useUserProfile();

// Merge cu datele din auth context
const user = {
  ...storeUser,
  ...apiUser,
  // Mappings pentru câmpuri
};

// Loading state
if (isLoading) {
  return <ActivityIndicator />;
}
```

---

### 2. **EditProfileScreen** - `mobile/src/features/profile/screens/EditProfileScreen.tsx`
✅ Integrare completă cu validări + upload avatar

**Pattern aplicat:**
```typescript
// Import hooks
import { useUpdateProfile, useUploadAvatar } from '@/features/profile/hooks/useUser';

// În component
const updateProfileMutation = useUpdateProfile();
const uploadAvatarMutation = useUploadAvatar();

// Upload avatar (FormData)
const handlePickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({...});

  const formData = new FormData();
  formData.append('file', { uri, name, type } as any);

  await uploadAvatarMutation.mutateAsync(formData);
};

// Update profil
const handleSave = async () => {
  await updateProfileMutation.mutateAsync({
    firstName: formData.firstName,
    lastName: formData.lastName,
    bio: formData.bio,
    phone: formData.phone,
    location: formData.location,
  });
};
```

---

### 3. **ConversationsListScreen** - `mobile/src/features/messaging/screens/ConversationsListScreen.tsx`
✅ Integrare completă cu filtre + search + real-time

**Pattern aplicat:**
```typescript
// Import hooks
import { useConversations } from '../hooks/useMessaging';

// În component
const {
  data: conversations = [],
  isLoading,
  refetch,
  isFetching,
} = useConversations({ type: filter });

// Filter local pentru search
const filteredConversations = useMemo(() => {
  if (!searchQuery) return conversations;
  return conversations.filter(conv => /* search logic */);
}, [conversations, searchQuery]);

// Refresh
const handleRefresh = useCallback(() => {
  refetch();
}, [refetch]);

// Loading state
{isLoading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator />
  </View>
)}

// Lista
<FlatList
  data={filteredConversations}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />}
/>
```

---

### 4. **ChatScreen** - `mobile/src/features/messaging/screens/ChatScreen.tsx`
✅ Integrare completă cu WebSocket real-time

**Pattern aplicat:**
```typescript
// Import hooks + socket
import {
  useMessages,
  useSendMessage,
  useConversation,
  useMarkAsRead,
} from '@/features/messaging/hooks/useMessaging';
import socketService from '@/features/messaging/services/socketService';

// În component
const { data: conversation, isLoading: isConversationLoading } = useConversation(conversationId);
const { data: messagesData, isLoading: isMessagesLoading } = useMessages(conversationId);
const sendMessageMutation = useSendMessage();
const markAsReadMutation = useMarkAsRead();

// WebSocket setup
useEffect(() => {
  if (!conversationId || !socketService.getIsConnected()) return;

  socketService.joinConversation(conversationId);

  const handleNewMessage = (message: IMessage) => {
    setMessages((prev) => [mapMessage(message), ...prev]);
  };

  socketService.onNewMessage(handleNewMessage);

  return () => {
    socketService.leaveConversation(conversationId);
    socketService.off('message:new', handleNewMessage);
  };
}, [conversationId]);

// Send message (WebSocket first, REST fallback)
const handleSendMessage = async (content: string) => {
  if (socketService.getIsConnected()) {
    socketService.sendMessage(conversationId, content, 'TEXT');
  } else {
    await sendMessageMutation.mutateAsync({ conversationId, content, type: 'TEXT' });
  }
};

// Mark as read on enter
useEffect(() => {
  if (conversationId) {
    markAsReadMutation.mutate(conversationId);
  }
}, [conversationId]);
```

---

### 5. **SavedSearchesScreen** - `mobile/src/features/search/screens/SavedSearchesScreen.tsx`
✅ Integrare completă (din sesiunea anterioară)

**Pattern aplicat:**
```typescript
// Import hooks
import { useSavedSearches, useDeleteSavedSearch, useToggleSavedSearchAlerts } from '../hooks/useSavedSearches';

// În component
const { data: searches = [], isLoading, refetch } = useSavedSearches();
const deleteMutation = useDeleteSavedSearch();
const toggleAlertsMutation = useToggleSavedSearchAlerts();

// Mutations
const handleToggleAlert = async (searchId: number, enabled: boolean) => {
  try {
    await toggleAlertsMutation.mutateAsync({
      id: searchId,
      enabled,
      frequency: enabled ? 'DAILY' : undefined,
    });
  } catch (error) {
    Alert.alert('Eroare', 'Nu s-au putut actualiza alertele');
  }
};

const handleDelete = async (searchId: number) => {
  Alert.alert('Confirmare', 'Ștergi această căutare salvată?', [
    { text: 'Anulează', style: 'cancel' },
    {
      text: 'Șterge',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteMutation.mutateAsync(searchId);
        } catch (error) {
          Alert.alert('Eroare', 'Nu s-a putut șterge căutarea');
        }
      },
    },
  ]);
};
```

---

## 📋 Pattern General Pentru Orice Screen

### Step 1: Import hooks React Query
```typescript
import { useFeature, useCreateFeature, useUpdateFeature, useDeleteFeature } from '../hooks/useFeature';
```

### Step 2: Setup hooks în component
```typescript
const { data, isLoading, refetch, isFetching } = useFeature(params);
const createMutation = useCreateFeature();
const updateMutation = useUpdateFeature();
const deleteMutation = useDeleteFeature();
```

### Step 3: Loading State
```typescript
if (isLoading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary.main} />
      <Text style={styles.loadingText}>Se încarcă...</Text>
    </View>
  );
}
```

### Step 4: Empty State
```typescript
if (!data || data.length === 0) {
  return (
    <View style={styles.emptyContainer}>
      <Icon size={64} color={theme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>Nicio înregistrare</Text>
      <Button title="Adaugă primul item" onPress={handleCreate} />
    </View>
  );
}
```

### Step 5: Lista cu FlatList
```typescript
<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemCard item={item} onPress={() => handlePress(item.id)} />}
  refreshControl={
    <RefreshControl
      refreshing={isFetching}
      onRefresh={refetch}
      tintColor={theme.colors.primary.main}
    />
  }
  ListEmptyComponent={<EmptyState />}
/>
```

### Step 6: Mutations cu error handling
```typescript
const handleCreate = async () => {
  try {
    await createMutation.mutateAsync(data);
    Alert.alert('Succes', 'Item creat cu succes!');
  } catch (error) {
    console.error('Create failed:', error);
    Alert.alert('Eroare', 'Nu am putut crea item-ul');
  }
};

const handleUpdate = async (id: string, data: UpdateData) => {
  try {
    await updateMutation.mutateAsync({ id, ...data });
    Alert.alert('Succes', 'Item actualizat!');
  } catch (error) {
    console.error('Update failed:', error);
    Alert.alert('Eroare', 'Nu am putut actualiza item-ul');
  }
};

const handleDelete = async (id: string) => {
  Alert.alert('Confirmare', 'Sigur vrei să ștergi?', [
    { text: 'Anulează', style: 'cancel' },
    {
      text: 'Șterge',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteMutation.mutateAsync(id);
        } catch (error) {
          Alert.alert('Eroare', 'Nu am putut șterge');
        }
      },
    },
  ]);
};
```

---

## 🔄 Hooks Disponibile Pentru Toate Features

### ✅ Profil (`mobile/src/features/profile/hooks/useUser.ts`)
- `useUserProfile()` - GET /users/me
- `useUpdateProfile()` - PUT /users/me
- `useUploadAvatar()` - PATCH /users/me/avatar

### ✅ Mesaje (`mobile/src/features/messaging/hooks/useMessaging.ts`)
- `useConversations({ type, page, limit })` - GET /conversations
- `useConversation(id)` - GET /conversations/:id
- `useMessages(conversationId)` - GET /conversations/:id/messages
- `useStartConversation()` - POST /conversations
- `useSendMessage()` - POST /conversations/:id/messages
- `useMarkAsRead()` - POST /conversations/:id/read
- `useArchiveConversation()` - POST /conversations/:id/archive
- `useUnarchiveConversation()` - POST /conversations/:id/unarchive
- `useUnreadCount()` - GET /conversations/unread-count

### ✅ Vizionări (`mobile/src/features/viewings/hooks/useViewings.ts`)
- `useViewings({ role, status, page, limit })` - GET /viewings
- `useUpcomingViewings()` - GET /viewings/upcoming
- `useViewing(id)` - GET /viewings/:id
- `useRequestViewing()` - POST /viewings
- `useConfirmViewing()` - PATCH /viewings/:id/status (CONFIRMED)
- `useRejectViewing()` - PATCH /viewings/:id/status (REJECTED)
- `useCancelViewing()` - PATCH /viewings/:id/status (CANCELLED)

### ✅ KYC (`mobile/src/features/kyc/hooks/useKyc.ts`)
- `useKycStatus()` - GET /kyc/status
- `useStartIdVerification()` - POST /kyc/verify-id (FormData: docFront, docBack, selfie, docType)
- `useUploadPropertyDocument()` - POST /kyc/property-doc (FormData: file, propertyId, docType)

### ✅ Notificări (`mobile/src/features/notifications/hooks/useNotifications.ts`)
- `useNotifications()` - GET /notifications
- `useUnreadNotificationsCount()` - Count unread
- `useMarkNotificationAsRead(id)` - PATCH /notifications/:id/read
- `useMarkAllNotificationsAsRead()` - POST /notifications/read-all
- `useRegisterPushToken()` - POST /devices/push-token
- `useNotificationPreferences()` - GET /notifications/settings
- `useUpdateNotificationPreferences()` - PUT /users/me/notification-preferences

### ✅ Properties (`mobile/src/features/properties/hooks/useProperties.ts`)
- `useProperties(params)` - GET /properties
- `usePropertyDetail(id)` - GET /properties/:id
- `useMyProperties()` - GET /properties/my
- `useCreateProperty()` - POST /properties
- `useUpdateProperty(id)` - PATCH /properties/:id
- `useDeleteProperty(id)` - DELETE /properties/:id
- `useUploadPropertyPhotos(id)` - POST /properties/:id/photos (FormData)
- `useUpdatePropertyStatus(id)` - PATCH /properties/:id/toggle-active
- `usePropertyAnalytics(id)` - GET /properties/:id/stats

### ✅ Search (`mobile/src/features/search/hooks/useSearch.ts`)
- `useSearch(params)` - GET /search/properties
- `useSearchSuggestions(query)` - GET /search/suggestions
- `useMapData(bounds)` - GET /search/properties (for map)
- `useSearchFacets()` - GET facets/aggregations

### ✅ Saved Searches (`mobile/src/features/search/hooks/useSavedSearches.ts`)
- `useSavedSearches()` - GET /saved-searches
- `useSavedSearch(id)` - GET /saved-searches/:id
- `useExecuteSavedSearch(id)` - GET /saved-searches/:id/run
- `useCreateSavedSearch()` - POST /saved-searches
- `useUpdateSavedSearch(id)` - PATCH /saved-searches/:id
- `useDeleteSavedSearch(id)` - DELETE /saved-searches/:id
- `useToggleSavedSearchAlerts(id)` - PATCH /saved-searches/:id/alerts

### ✅ Favorites (`mobile/src/features/favorites/hooks/useFavorites.ts`)
- `useFavorites()` - GET /favorites
- `useAddFavorite()` - POST /favorites
- `useRemoveFavorite(propertyId)` - DELETE /favorites/:propertyId
- `useCheckFavorite(propertyId)` - GET /favorites/check/:propertyId

---

## 📊 Status Integrare Screen-uri

### ✅ COMPLET (5 screen-uri)
1. ProfileScreen
2. EditProfileScreen
3. ConversationsListScreen
4. ChatScreen
5. SavedSearchesScreen

### 🔄 DE INTEGRAT (Pattern deja există, trebuie aplicat):

#### Vizionări (3 screen-uri)
- [ ] ViewingsListScreen → `useViewings()`, `useUpcomingViewings()`
- [ ] ViewingDetailScreen → `useViewing(id)`, `useConfirmViewing()`, `useCancelViewing()`
- [ ] RequestViewingScreen → `useRequestViewing()`

#### Verificare/KYC (2 screen-uri)
- [ ] VerificationHubScreen → `useKycStatus()`
- [ ] IdentityVerificationScreen → `useStartIdVerification()`, `useUploadPropertyDocument()`

#### Notificări (2 screen-uri)
- [ ] NotificationsScreen → `useNotifications()`, `useMarkNotificationAsRead()`, `useMarkAllNotificationsAsRead()`
- [ ] NotificationSettingsScreen → `useNotificationPreferences()`, `useUpdateNotificationPreferences()`

#### Core Properties (5 screen-uri)
- [ ] HomeScreen → `useProperties({ featured: true })`, `useSavedSearches()`
- [ ] SearchResultsScreen → `useSearch(params)`, `useSearchFacets()`
- [ ] PropertyDetailScreen → `usePropertyDetail(id)`, `useAddFavorite()`, `useStartConversation()`
- [ ] MyPropertiesScreen → `useMyProperties()`, `useUpdatePropertyStatus()`, `usePropertyAnalytics()`
- [ ] CreatePropertyScreen/Wizard → `useCreateProperty()`, `useUploadPropertyPhotos()`

#### Search & Filters (2 screen-uri)
- [ ] FiltersScreen → `useSearchFacets()`, form state local
- [ ] MapSearchScreen → `useMapData(bounds)`

---

## 🚀 Next Steps Pentru Echipa Mobile

1. **Continuă pattern-ul** demonstrat în cele 5 screen-uri integrate complet
2. **Folosește hook-urile** existente - toate sunt gata și testate
3. **Copiază structura** din screen-urile integrate ca referință
4. **Testează cu backend-ul** pe port 4000
5. **WebSocket** - Folosește `socketService` pentru real-time features

Toate API-urile, hook-urile și tipurile sunt 100% gata și aligned cu backend-ul! 🎉
