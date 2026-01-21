/**
 * IMOBI - Property Detail Screen
 * Comprehensive property information view
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Share,
} from 'react-native';
import {
  ChevronLeft,
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
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { 
  Badge, 
  IconButton, 
  Button, 
  Divider 
} from '@/shared/components';
import { useNavigation, useRoute, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { SearchStackParamList, MainTabParamList, ProfileStackParamList } from '@/app/navigation/types';

// Combined navigation type for cross-tab navigation
type PropertyDetailNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SearchStackParamList, 'PropertyDetail'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 400;

// ============================================
// COMPONENT
// ============================================

const PropertyDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<PropertyDetailNavigationProp>();
  const route = useRoute();
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock property data
  const property = {
    title: 'Apartament 3 camere, Metrou Dristor, Renovat Premium',
    price: 98500,
    currency: 'EUR',
    location: {
      address: 'Strada Râmnicu Vâlcea, nr. 12',
      city: 'București',
      neighborhood: 'Dristor',
    },
    characteristics: {
      rooms: 3,
      bedrooms: 2,
      bathrooms: 2,
      totalArea: 78,
      usableArea: 72,
      floor: 4,
      totalFloors: 10,
      yearBuilt: 1982,
      comfort: '1',
    },
    amenities: ['Centrală proprie', 'Aer condiționat', 'Mobilat', 'Utilat', 'Boxă', 'Balcon închis'],
    description: 'Vă propunem spre vânzare un apartament cu 3 camere situat în zona Dristor, la doar 5 minute de gura de metrou. Apartamentul a fost renovat complet în 2023, fiind schimbate inclusiv instalațiile electrice și sanitare.\n\nFinisaje premium: gresie PORCELANOSA, parchet din lemn stratificat, baterii GROHE.',
    ownerId: 'owner-123',
    owner: {
      id: 'owner-123',
      name: 'Andrei Popescu',
      isVerified: true,
      memberSince: '2021',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    },
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
    ]
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Vezi acest apartament pe IMOBI: ${property.title} - ${property.price}€`,
      });
    } catch (error) {
      console.log(error);
    }
  };

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
        {/* Photo Gallery Header */}
        <View style={styles.galleryContainer}>
          <Image source={{ uri: property.images[0] }} style={styles.mainImage} />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.headerGradient}
          />

          {/* Gallery Overlay Actions */}
          <SafeAreaView style={styles.headerActions}>
            <IconButton
              icon={<ChevronLeft size={24} color="#ffffff" />}
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
                onPress={() => setIsFavorite(!isFavorite)}
                variant="ghost"
                style={{ ...styles.headerIconButton, backgroundColor: 'rgba(0,0,0,0.3)' }}
              />
            </View>
          </SafeAreaView>

          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>1 / {property.images.length}</Text>
          </View>
        </View>

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
              {property.location.neighborhood}, {property.location.city}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.primary.main }]}>
              {property.price.toLocaleString('ro-RO')} €
            </Text>
          </View>

          {/* Key Characteristics */}
          <View style={[styles.characteristicsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
             <InfoItem icon={Bed} value={property.characteristics.rooms} label="Camere" />
             <InfoItem icon={Maximize2} value={`${property.characteristics.totalArea} m²`} label="Suprafață" />
             <InfoItem icon={Layers} value={`${property.characteristics.floor}/${property.characteristics.totalFloors}`} label="Etaj" />
             <InfoItem icon={Calendar} value={property.characteristics.yearBuilt} label="An constr." />
          </View>

          {/* AI Assistant Banner */}
          <TouchableOpacity 
            style={[styles.aiBanner, { backgroundColor: `${theme.colors.primary.main}10` }]}
            activeOpacity={0.9}
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
              <Text style={[styles.aiTitle, { color: theme.colors.textPrimary }]}>Analiză IMOBI AI</Text>
              <Text style={[styles.aiSubtitle, { color: theme.colors.textSecondary }]}>Întreabă AI despre acest apartament.</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.primary.main} />
          </TouchableOpacity>

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
                  params: { userId: property.ownerId }
                } as any);
              }}
            >
              <View style={styles.ownerInfo}>
                <Image source={{ uri: property.owner.photo }} style={styles.ownerPhoto} />
                <View>
                  <View style={styles.ownerNameRow}>
                    <Text style={[styles.ownerName, { color: theme.colors.textPrimary }]}>{property.owner.name}</Text>
                    {property.owner.isVerified && <ShieldCheck size={16} color={theme.colors.accent.main} />}
                  </View>
                  <Text style={[styles.ownerMeta, { color: theme.colors.textTertiary }]}>Proprietar · Vezi profil</Text>
                </View>
              </View>
              <Badge label="Verificat" variant="info" size="sm" />
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
              // @ts-ignore - Temporary until we fix navigation types across stacks
              navigation.navigate('MessagesTab', {
                screen: 'Chat',
                params: { 
                  conversationId: 'new',
                  propertyId: '1', // Mock ID
                  recipientName: property.owner.name 
                }
              });
            }}
            variant="ghost"
            style={{ width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.divider }}
          />
          <Button
            title="Sunați"
            icon={<Phone size={20} color="#ffffff" />}
            onPress={() => {}}
            variant="primary"
            style={{ flex: 1, height: 56, borderRadius: 16 }}
          />
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
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
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
});

export default PropertyDetailScreen;
