import React, { useState } from 'react';
import { View, Image, ScrollView, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

/** Galería horizontal paginada con indicador "1 de 3". */
export default function ImageGallery({ imagenes = [], alt = 'Imagen del evento', height = 200 }) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, 900) - 32;
  const [actual, setActual] = useState(0);

  if (!imagenes.length) return <Placeholder height={height} />;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ width, borderRadius: radius.md }}
      >
        {imagenes.map((uri, i) => (
          <Image
            key={uri + i}
            source={{ uri }}
            style={{ width, height }}
            resizeMode="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${alt}, imagen ${i + 1} de ${imagenes.length}`}
          />
        ))}
      </ScrollView>
      {imagenes.length > 1 && (
        <Text style={styles.counter} importantForAccessibility="no" accessibilityElementsHidden>
          {actual + 1} / {imagenes.length}
        </Text>
      )}
    </View>
  );
}

export function Placeholder({ height = 140 }) {
  return (
    <View
      style={[styles.placeholder, { height }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name="image-outline" size={32} color={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  counter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(15,23,42,0.75)',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '700',
  },
  placeholder: {
    backgroundColor: '#e2e8f0',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
