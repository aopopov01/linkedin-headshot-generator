/**
 * OmniShot Gallery Screen
 * View and manage previously generated professional photos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } = DesignSystem;

const MOCK_GALLERY_ITEMS = [
  {
    id: '1',
    style: 'Executive',
    platforms: ['linkedin', 'facebook'],
    createdAt: new Date(),
    thumbnail: 'https://picsum.photos/300/300?random=1',
  },
  {
    id: '2',
    style: 'Creative',
    platforms: ['instagram', 'twitter'],
    createdAt: new Date(Date.now() - 86400000),
    thumbnail: 'https://picsum.photos/300/300?random=2',
  },
  // Add more mock items as needed
];

const GalleryScreen = ({ navigation }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const handleItemPress = (item) => {
    if (selectionMode) {
      toggleSelection(item.id);
    } else {
      // Navigate to results view
      navigation.navigate('ResultsView', { 
        galleryItem: item,
        // Mock the results data
        photo: { uri: item.thumbnail },
        selectedStyle: item.style.toLowerCase(),
        selectedPlatforms: item.platforms,
      });
    }
  };

  const toggleSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Photos',
      `Delete ${selectedItems.length} photo${selectedItems.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Handle deletion
            setSelectedItems([]);
            setSelectionMode(false);
          }
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Your Gallery</Text>
        <Text style={styles.headerSubtitle}>
          {MOCK_GALLERY_ITEMS.length} professional photo{MOCK_GALLERY_ITEMS.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => {
          if (selectionMode) {
            setSelectedItems([]);
          }
          setSelectionMode(!selectionMode);
        }}
      >
        <Text style={styles.selectButtonText}>
          {selectionMode ? 'Cancel' : 'Select'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGalleryItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.galleryItem,
          isSelected && styles.selectedGalleryItem,
        ]}
        onPress={() => handleItemPress(item)}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.itemImage} />
        
        {selectionMode && (
          <View style={[
            styles.selectionOverlay,
            isSelected && styles.selectedOverlay,
          ]}>
            {isSelected && (
              <Icon name="check" size={20} color={COLORS.text.inverse} />
            )}
          </View>
        )}
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemStyle}>{item.style}</Text>
          <View style={styles.itemPlatforms}>
            {item.platforms.slice(0, 2).map(platform => (
              <View 
                key={platform} 
                style={[
                  styles.platformDot,
                  { backgroundColor: COLORS.platform[platform] || COLORS.neutral[400] }
                ]} 
              />
            ))}
            {item.platforms.length > 2 && (
              <Text style={styles.morePlatforms}>
                +{item.platforms.length - 2}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectionActions = () => {
    if (!selectionMode || selectedItems.length === 0) return null;
    
    return (
      <View style={styles.selectionActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Icon name="trash-2" size={16} color={COLORS.semantic.error} />
          <Text style={styles.deleteButtonText}>
            Delete ({selectedItems.length})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={MOCK_GALLERY_ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={renderGalleryItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {renderSelectionActions()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  
  selectButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  selectButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.secondary[500],
    fontWeight: '500',
  },
  
  gridContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  
  row: {
    justifyContent: 'space-between',
  },
  
  galleryItem: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
    position: 'relative',
  },
  
  selectedGalleryItem: {
    borderWidth: 3,
    borderColor: COLORS.secondary[500],
  },
  
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.background.tertiary,
  },
  
  selectionOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text.inverse,
  },
  
  selectedOverlay: {
    backgroundColor: COLORS.secondary[500],
    borderColor: COLORS.secondary[500],
  },
  
  itemInfo: {
    padding: SPACING.md,
  },
  
  itemStyle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  
  itemPlatforms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  platformDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  morePlatforms: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontSize: 10,
  },
  
  selectionActions: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    ...SHADOWS.subtle,
  },
  
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.semantic.error,
    backgroundColor: COLORS.background.primary,
    gap: SPACING.sm,
  },
  
  deleteButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.semantic.error,
    fontWeight: '600',
  },
});

export default GalleryScreen;