import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import StateView from '../components/StateView';
import { colors } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import CatalogoScreen from '../screens/CatalogoScreen';
import EventoDetalleScreen from '../screens/EventoDetalleScreen';
import MisComprasScreen from '../screens/MisComprasScreen';
import CompraDetalleScreen from '../screens/CompraDetalleScreen';
import ChatCompraScreen from '../screens/ChatCompraScreen';
import CrearEventoScreen from '../screens/CrearEventoScreen';
import MisEventosScreen from '../screens/MisEventosScreen';
import EventoComprasScreen from '../screens/EventoComprasScreen';
import ReseniasOrganizadorScreen from '../screens/ReseniasOrganizadorScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg },
};

const stackOptions = {
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
  headerBackButtonDisplayMode: 'minimal',
};

/** Pantallas que se pueden abrir desde cualquier pestaña. */
function pantallasComunes() {
  return [
    <Stack.Screen key="EventoDetalle" name="EventoDetalle" component={EventoDetalleScreen} options={{ title: 'Evento' }} />,
    <Stack.Screen key="CompraDetalle" name="CompraDetalle" component={CompraDetalleScreen} options={{ title: 'Compra' }} />,
    <Stack.Screen key="ChatCompra" name="ChatCompra" component={ChatCompraScreen} options={{ title: 'Chat de la compra' }} />,
  ];
}

function ExplorarStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Catalogo" component={CatalogoScreen} options={{ headerShown: false, title: "Eventos" }} />
      {pantallasComunes()}
    </Stack.Navigator>
  );
}

function ComprasStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MisComprasHome" component={MisComprasScreen} options={{ headerShown: false, title: "Mis compras" }} />
      {pantallasComunes()}
    </Stack.Navigator>
  );
}

function OrganizadorStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MisEventos" component={MisEventosScreen} options={{ headerShown: false, title: "Mis eventos" }} />
      <Stack.Screen name="CrearEvento" component={CrearEventoScreen} options={{ title: 'Crear evento' }} />
      <Stack.Screen name="EventoCompras" component={EventoComprasScreen} options={{ title: 'Compras del evento' }} />
      {pantallasComunes()}
    </Stack.Navigator>
  );
}

const tabIcon = (name) => ({ color, size, focused }) => (
  <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
);

function MainTabs() {
  const { hasRole } = useAuth();
  const esComprador = hasRole('COMPRADOR');
  const esOrganizador = hasRole('ORGANIZADOR');

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {esComprador && (
        <Tab.Screen
          name="Explorar"
          component={ExplorarStack}
          options={{ tabBarLabel: 'Explorar', tabBarIcon: tabIcon('search') }}
        />
      )}
      {esComprador && (
        <Tab.Screen
          name="MisCompras"
          component={ComprasStack}
          options={{ tabBarLabel: 'Mis compras', tabBarIcon: tabIcon('ticket') }}
        />
      )}
      {esOrganizador && (
        <Tab.Screen
          name="Organizar"
          component={OrganizadorStack}
          options={{ tabBarLabel: 'Mis eventos', tabBarIcon: tabIcon('calendar') }}
        />
      )}
      {esOrganizador && (
        <Tab.Screen
          name="Resenias"
          component={ReseniasOrganizadorScreen}
          options={{ tabBarLabel: 'Reseñas', tabBarIcon: tabIcon('star') }}
        />
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <StateView loading />;
  return (
    <NavigationContainer
      theme={theme}
      documentTitle={{
        formatter: (options, route) =>
          `${options?.title ?? (user ? route?.name : 'Ingresar')} · AI Ticket It`,
      }}
    >
      {user ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}
