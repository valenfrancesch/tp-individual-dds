import { Alert, Platform, AccessibilityInfo } from 'react-native';

/**
 * Diálogos multiplataforma. En react-native-web `Alert.alert` con botones no
 * hace nada, así que en web se usa window.alert / window.confirm.
 */
export function notify(title, message = '') {
  AccessibilityInfo.announceForAccessibility?.(`${title}. ${message}`);
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Devuelve una promesa que resuelve true si el usuario confirma. */
export function confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Volver', destructive = false }) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function announce(message) {
  AccessibilityInfo.announceForAccessibility?.(message);
}
