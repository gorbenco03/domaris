/**
 * RIVA - Property Detail Screen
 * Comprehensive property information view
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Share,
  Alert,
  FlatList,
  Modal,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Layers,
  Calendar,
  Sparkles,
  Phone,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Wind,
  Flame,
  Car,
  Wifi,
  Tv,
  ArrowUpCircle,
  Sofa,
  Refrigerator,
  Sun,
  Video,
  Smartphone,
  Monitor,
  Globe,
  Waves,
  Utensils,
  Droplets,
  Thermometer,
  Dumbbell,
  CalendarCheck,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { 
  Badge, 
  IconButton, 
  Button, 
  Divider 
} from '@/shared/components';
import {
  usePropertyDetail,
  useFavoriteStatus,
  useToggleFavorite,
  startConversation,
  trackPropertyView,
} from '@/features/search/services';
import { useRequireAuth } from '@/shared/hooks';
import { ActivityIndicator, Linking } from 'react-native';
import { useNavigation, useRoute, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { SearchStackParamList, MainTabParamList, ProfileStackParamList } from '@/app/navigation/types';
import { AVMValuationCard } from '@/features/properties/components/AVMValuationCard';

// Combined navigation type for cross-tab navigation
type PropertyDetailNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SearchStackParamList, 'PropertyDetail'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 400;

const AMENITIES_MAP: Record<string, { label: string; icon: any }> = {
  AIR_CONDITIONING: { label: 'Aer condiționat', icon: Wind },
  CENTRAL_HEATING: { label: 'Centrală proprie', icon: Flame },
  PARKING: { label: 'Parcare', icon: Car },
  ELEVATOR: { label: 'Lift', icon: ArrowUpCircle },
  BALCONY: { label: 'Balcon', icon: Maximize2 },
  FURNISHED: { label: 'Mobilat', icon: Sofa },
  WIFI: { label: 'Wi-Fi', icon: Wifi },
  TV: { label: 'TV', icon: Tv },
  SECURITY: { label: 'Pază', icon: ShieldCheck },
  
  // New mappings from screenshot
  KITCHEN_APPLIANCES: { label: 'Electrocasnice', icon: Refrigerator },
  DRYER: { label: 'Uscător', icon: Waves },
  TERRACE: { label: 'Terasă', icon: Sun },
  SECURITY_SYSTEM: { label: 'Sistem Securitate', icon: Video },
  SMART_HOME: { label: 'Smart Home', icon: Smartphone },
  CABLE_TV: { label: 'Cablu TV', icon: Monitor },
  FIBER_INTERNET: { label: 'Internet Fibră', icon: Globe },
  
  // More mappings
  DISHWASHER: { label: 'Mașină de spălat vase', icon: Utensils },
  WASHER: { label: 'Mașină de spălat rufe', icon: Droplets },
  SEMI_FURNISHED: { label: 'Semi-mobilat', icon: Sofa },
  UNDERFLOOR_HEATING: { label: 'Încălzire în pardoseală', icon: Thermometer },
  FIREPLACE: { label: 'Șemineu', icon: Flame },
  SAUNA: { label: 'Saună', icon: Thermometer }, // sau Waves
  GYM: { label: 'Sală de sport', icon: Dumbbell },
  VIDEO_INTERCOM: { label: 'Videointerfon', icon: Video },
};

// ============================================
// COMPONENT
// ============================================

const PropertyDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<PropertyDetailNavigationProp>();
  const route = useRoute<any>();
  const { propertyId } = route.params;
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const viewTrackedRef = useRef<string | null>(null);
  const galleryFlatListRef = useRef<FlatList>(null);
  const fullscreenFlatListRef = useRef<FlatList>(null);
  const propertyIdNumber = Number(propertyId);

  const onGalleryScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(idx);
  }, []);

  const openFullscreen = useCallback((index: number) => {
    translateY.value = 0;
    bgOpacity.value = 1;
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  }, []);

  const onFullscreenScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setFullscreenIndex(idx);
  }, []);

  // Swipe-to-dismiss with react-native-reanimated + gesture-handler
  const translateY = useSharedValue(0);
  const bgOpacity = useSharedValue(1);
  const DISMISS_THRESHOLD = 100;

  const closeFullscreen = useCallback(() => {
    setFullscreenVisible(false);
    // Sync gallery position
    if (galleryFlatListRef.current && fullscreenIndex !== activeImageIndex) {
      galleryFlatListRef.current.scrollToOffset({
        offset: fullscreenIndex * width,
        animated: false,
      });
      setActiveImageIndex(fullscreenIndex);
    }
  }, [fullscreenIndex, activeImageIndex]);

  const dismissGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-10, 10])
    .onUpdate((e) => {
      translateY.value = e.translationY;
      bgOpacity.value = Math.max(0.2, 1 - Math.abs(e.translationY) / 350);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationY) > DISMISS_THRESHOLD || Math.abs(e.velocityY) > 800) {
        const target = e.translationY > 0 ? 800 : -800;
        translateY.value = withTiming(target, { duration: 200 });
        bgOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(closeFullscreen)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        bgOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${bgOpacity.value})`,
  }));

  // Real data fetching
  const { data: property, isLoading, error } = usePropertyDetail(propertyId);
  const { data: favoriteStatus } = useFavoriteStatus(
    Number.isFinite(propertyIdNumber) ? propertyIdNumber : undefined,
    { enabled: isAuthenticated }
  );
  const toggleFavoriteMutation = useToggleFavorite();

  useEffect(() => {
    if (favoriteStatus) {
      setIsFavorite(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  useEffect(() => {
    if (!property?.id) return;
    const currentId = String(property.id);
    if (viewTrackedRef.current === currentId) return;

    let isActive = true;
    const timer = setTimeout(() => {
      if (!isActive) return;
      trackPropertyView(currentId).catch((error) => {
        console.warn('Failed to track property view', error);
      });
      viewTrackedRef.current = currentId;
    }, 3000);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [property?.id]);

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Vezi acest apartament pe RIVA: ${property.title} - ${property.price}€`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!Number.isFinite(propertyIdNumber) || toggleFavoriteMutation.isPending) return;
    if (!requireAuth({ message: 'Autentifică-te pentru a salva favorite.' })) {
      return;
    }
    const currentValue = isFavorite;
    setIsFavorite(!currentValue);
    try {
      await toggleFavoriteMutation.mutateAsync({
        propertyId: propertyIdNumber,
        currentlyFavorite: currentValue,
      });
    } catch (error) {
      setIsFavorite(currentValue);
      console.warn('Failed to toggle favorite', error);
    }
  };

  const handleCall = () => {
    const owner = (property as any)?.owner || property?.user;
    if (owner?.phone) {
      Linking.openURL(`tel:${owner.phone}`);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>
          Proprietatea nu a putut fi găsită.
        </Text>
        <Button title="Înapoi" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // Map amenities
  const amenities = property.amenities || [];
  const propertyImages = property.images || property.photos || [];
  const images = propertyImages.length > 0 
    ? propertyImages.map((p: any) => p.url) 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'];

  // Get owner data (backend returns 'owner', frontend type might expect 'user')
  const owner = (property as any).owner || property.user;


  const InfoItem = ({ icon: Icon, value, label }: any) => (
    <View style={styles.infoItem}>
      <Icon size={24} color={theme.colors.textSecondary} />
      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo Gallery Header — Swipeable Carousel */}
        <View style={styles.galleryContainer}>
          <FlatList
            ref={galleryFlatListRef}
            data={images}
            keyExtractor={(_, i) => `gallery-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onGalleryScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => openFullscreen(index)}
                style={{ width, height: IMAGE_HEIGHT }}
              >
                <Image source={{ uri: item }} style={styles.mainImage} contentFit="cover" cachePolicy="disk" transition={200} />
              </TouchableOpacity>
            )}
          />

          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.headerGradient}
            pointerEvents="none"
          />

          {/* Gallery Overlay Actions */}
          <SafeAreaView style={styles.headerActions}>
            <IconButton
              icon={<ArrowLeft size={22} color="#ffffff" />}
              onPress={() => navigation.goBack()}
              variant="ghost"
              style={{ ...styles.headerIconButton, backgroundColor: 'rgba(0,0,0,0.3)' }}
            />
            <View style={styles.headerActionsRight}>
              <IconButton
                icon={<Share2 size={22} color="#ffffff" />}
                onPress={handleShare}
                variant="ghost"
                style={{ ...styles.headerIconButton, backgroundColor: 'rgba(0,0,0,0.3)' }}
              />
              <IconButton
                icon={<Heart size={22} color={isFavorite ? '#ef4444' : '#ffffff'} fill={isFavorite ? '#ef4444' : 'transparent'} />}
                onPress={handleToggleFavorite}
                variant="ghost"
                style={{ ...styles.headerIconButton, backgroundColor: 'rgba(0,0,0,0.3)' }}
              />
            </View>
          </SafeAreaView>

          {/* Image counter badge */}
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>{activeImageIndex + 1} / {images.length}</Text>
          </View>

          {/* Dot indicators */}
          {images.length > 1 && (
            <View style={styles.dotContainer}>
              {images.map((_: string, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === activeImageIndex ? '#ffffff' : 'rgba(255,255,255,0.5)' },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Fullscreen Image Viewer Modal */}
        <Modal
          visible={fullscreenVisible}
          transparent
          animationType="none"
          onRequestClose={closeFullscreen}
          statusBarTranslucent
        >
          <ReAnimated.View style={[styles.fullscreenContainer, animatedBgStyle]}>
            <StatusBar barStyle="light-content" />
            <GestureDetector gesture={dismissGesture}>
              <ReAnimated.View style={[{ flex: 1 }, animatedImageStyle]}>
                <FlatList
                  ref={fullscreenFlatListRef}
                  data={images}
                  keyExtractor={(_, i) => `fs-${i}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onFullscreenScroll}
                  scrollEventThrottle={16}
                  initialScrollIndex={fullscreenIndex}
                  getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Image
                        source={{ uri: item }}
                        style={{ width, height: '100%' }}
                        contentFit="contain"
                        cachePolicy="disk"
                        transition={200}
                      />
                    </View>
                  )}
                />
              </ReAnimated.View>
            </GestureDetector>

            {/* Close button + counter */}
            <SafeAreaView style={styles.fullscreenHeader}>
              <TouchableOpacity onPress={closeFullscreen} style={styles.fullscreenCloseBtn}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.fullscreenCounter}>
                {fullscreenIndex + 1} / {images.length}
              </Text>
              <View style={{ width: 44 }} />
            </SafeAreaView>
          </ReAnimated.View>
        </Modal>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.badgesRow}>
            <Badge label="De vânzare" variant="primary" />
            <Badge label="Apartament" variant="info" />
          </View>

          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {property.title}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={18} color={theme.colors.accent.main} />
            <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
              {[property.addressText, property.neighborhood, property.city].filter(Boolean).join(', ')}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.primary.main }]}>
              {(property.priceEur || property.price || 0).toLocaleString('ro-RO')} €
            </Text>
          </View>

          {/* Key Characteristics */}
          <View style={[styles.characteristicsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
             <InfoItem icon={Bed} value={property.rooms} label="Camere" />
             <InfoItem icon={Maximize2} value={`${property.surfaceSqm || property.surface || 0} m²`} label="Suprafață" />
             <InfoItem icon={Layers} value={`${property.floor ?? '-'}/${property.totalFloors ?? '-'}`} label="Etaj" />
             <InfoItem icon={Calendar} value={property.yearBuilt || '-'} label="An constr." />
          </View>

          {/* Evaluare automată (AVM) — preț estimat vs. preț cerut */}
          <AVMValuationCard
            city={property.city}
            neighborhood={property.neighborhood}
            propertyType={property.propertyType}
            transactionType={(property.transactionType as 'SALE' | 'RENT') ?? 'SALE'}
            rooms={property.rooms}
            surfaceSqm={property.surfaceSqm || property.surface}
            floor={property.floor ?? undefined}
            totalFloors={property.totalFloors ?? undefined}
            yearBuilt={property.yearBuilt ?? undefined}
            amenities={property.amenities}
            askingPrice={property.priceEur || property.price}
          />

          {/* AI Assistant Banner */}
          <TouchableOpacity 
            style={[styles.aiBanner, { backgroundColor: `${theme.colors.primary.main}10` }]}
            activeOpacity={0.9}
            onPress={() => {
              if (!property?.id) return;
              // @ts-ignore - property insights in search/favorites stack
              navigation.navigate('PropertyInsights', { propertyId: String(property.id) });
            }}
          >
            <LinearGradient
              colors={[theme.colors.primary.main, theme.colors.primary.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiIconContainer}
            >
              <Sparkles size={20} color="#ffffff" />
            </LinearGradient>
            <View style={styles.aiTextContainer}>
              <Text style={[styles.aiTitle, { color: theme.colors.textPrimary }]}>Analiză RIVA AI</Text>
              <Text style={[styles.aiSubtitle, { color: theme.colors.textSecondary }]}>Întreabă AI despre acest apartament.</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.primary.main} />
          </TouchableOpacity>

          {/* Amenities Section */}
          {amenities && amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Facilități</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((amenity: string, index: number) => {
                  const config = AMENITIES_MAP[amenity] || { label: amenity, icon: CheckCircle2 };
                  const Icon = config.icon;
                  return (
                    <View key={index} style={[styles.amenityItem, { backgroundColor: theme.colors.background }]}>
                      <Icon size={20} color={theme.colors.textSecondary} />
                      <Text style={[styles.amenityText, { color: theme.colors.textPrimary }]}>{config.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Descriere</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {property.description}
            </Text>
          </View>

          <Divider />

          {/* Owner Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Publicat de</Text>
            <TouchableOpacity 
              style={[styles.ownerCard, { backgroundColor: theme.colors.surface }]}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to public profile - cross-tab navigation
                navigation.navigate('ProfileTab', {
                  screen: 'PublicProfile',
                  params: { userId: owner?.id }
                } as any);
              }}
            >
              <View style={styles.ownerInfo}>
                <Image source={{ uri: owner?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' }} style={styles.ownerPhoto} cachePolicy="disk" />
                <View>
                  <View style={styles.ownerNameRow}>
                    <Text style={[styles.ownerName, { color: theme.colors.textPrimary }]}>
                      {owner?.firstName
                        ? `${owner.firstName} ${owner.lastName || ''}`
                        : 'Utilizator Riva'}
                    </Text>
                    {property.ownershipStatus === 'verified' && <ShieldCheck size={16} color={theme.colors.accent.main} />}
                  </View>
                  <Text style={[styles.ownerMeta, { color: theme.colors.textTertiary }]}>Proprietar · Vezi profil</Text>
                </View>
              </View>
              {property.ownershipStatus === 'verified' && (
                <Badge label="Verificat" variant="info" size="sm" />
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Persistent Bottom Contact Bar */}
      <SafeAreaView style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
        <View style={styles.bottomBarContent}>
          <IconButton
            icon={<MessageCircle size={24} color={theme.colors.primary.main} />}
            onPress={() => {
              if (!requireAuth({ message: 'Autentifică-te pentru a trimite mesaje.' })) {
                return;
              }
              if (isStartingChat || !property) return;
              setIsStartingChat(true);
              startConversation({ propertyId: Number(property.id) })
                .then((conversation) => {
                  // @ts-ignore - Temporary until we fix navigation types across stacks
                  navigation.navigate('MessagesTab', {
                    screen: 'Chat',
                    params: {
                      conversationId: String(conversation.id),
                      propertyId: String(property.id),
                      recipientName: `${owner?.firstName || ''} ${owner?.lastName || ''}`.trim(),
                    },
                  });
                })
                .catch((error) => {
                  console.warn('Failed to start conversation', error);
                  Alert.alert('Eroare', 'Nu s-a putut începe conversația. Încearcă din nou.');
                })
                .finally(() => {
                  setIsStartingChat(false);
                });
            }}
            variant="ghost"
            style={{ width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.divider }}
          />
          <Button
            title="Programează vizionare"
            icon={<CalendarCheck size={20} color="#ffffff" />}
            onPress={() => {
              if (!requireAuth({ message: 'Autentifică-te pentru a programa o vizionare.' })) {
                return;
              }
              if (!property?.id) return;
              // Navigate to RequestViewing screen in ProfileTab
              navigation.navigate('ProfileTab', {
                screen: 'RequestViewing',
                params: { propertyId: String(property.id) },
              } as any);
            }}
            variant="primary"
            style={{ flex: 1, height: 56, borderRadius: 16 }}
          />
          {owner?.phone && (
            <IconButton
              icon={<Phone size={24} color={theme.colors.primary.main} />}
              onPress={handleCall}
              variant="ghost"
              style={{ width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.divider }}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  galleryContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerActionsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    borderRadius: 25,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 44,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 5,
  },
  imageCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Fullscreen image viewer
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
  },
  fullscreenCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCounter: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    // backgroundColor is now applied dynamically via theme.colors.surface
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    lineHeight: 32,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 24,
  },
  price: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  characteristicsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    gap: 16,
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  aiSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 26,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    // backgroundColor is now applied dynamically
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  ownerMeta: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  bottomBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default PropertyDetailScreen;
