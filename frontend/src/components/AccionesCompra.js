import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from './Button';
import { ComprasApi } from '../api/client';
import { confirm, notify, announce } from '../utils/dialogs';
import { formatMoney } from '../utils/format';

/**
 * Botones de las acciones que el backend habilitó para esta compra
 * (`compra.acciones`). La UI no duplica las reglas de negocio.
 */
const ACCIONES = {
  pagar: {
    titulo: 'Pagar',
    icon: 'card-outline',
    variant: 'primary',
    api: ComprasApi.pagar,
    confirmar: (c) => ({
      title: 'Confirmar pago',
      message: `Se cobrarán ${formatMoney(c.total)} por ${c.cantidad} × ${c.tipoEntrada.nombre}.`,
      confirmText: 'Pagar',
    }),
    ok: 'Pago confirmado',
  },
  utilizar: {
    titulo: 'Marcar utilizada',
    icon: 'checkmark-done-outline',
    variant: 'primary',
    api: ComprasApi.utilizar,
    confirmar: (c) => ({
      title: 'Registrar ingreso',
      message: `¿${c.comprador?.nombre} ya ingresó al evento con ${c.cantidad} entrada(s)?`,
      confirmText: 'Sí, utilizada',
    }),
    ok: 'Entrada marcada como utilizada',
  },
  reembolsar: {
    titulo: 'Marcar reembolsada',
    icon: 'cash-outline',
    variant: 'secondary',
    api: ComprasApi.reembolsar,
    confirmar: (c) => ({
      title: 'Registrar reembolso',
      message: `Confirmá que devolviste ${formatMoney(c.total)} a ${c.comprador?.nombre}.`,
      confirmText: 'Reembolsada',
    }),
    ok: 'Reembolso registrado',
  },
  cancelar: {
    titulo: 'Cancelar compra',
    icon: 'close-circle-outline',
    variant: 'danger',
    api: ComprasApi.cancelar,
    confirmar: (c) => ({
      title: 'Cancelar compra',
      message: c.fuePagada
        ? `Se liberarán las entradas y el organizador te devolverá ${formatMoney(c.total)}. Esta acción no se puede deshacer.`
        : 'Se liberará la reserva. Esta acción no se puede deshacer.',
      confirmText: 'Cancelar compra',
      cancelText: 'Volver',
      destructive: true,
    }),
    ok: 'Compra cancelada',
  },
};

export default function AccionesCompra({ compra, onDone, small = false, excluir = [] }) {
  const [enCurso, setEnCurso] = useState(null);
  const visibles = Object.keys(ACCIONES).filter(
    (a) => compra.acciones?.includes(a) && !excluir.includes(a),
  );
  if (!visibles.length) return null;

  const ejecutar = async (clave) => {
    const accion = ACCIONES[clave];
    if (!(await confirm(accion.confirmar(compra)))) return;
    try {
      setEnCurso(clave);
      const actualizada = await accion.api(compra.id);
      announce(accion.ok);
      onDone?.(actualizada);
    } catch (e) {
      notify('No se pudo completar', e.message);
    } finally {
      setEnCurso(null);
    }
  };

  return (
    <View style={styles.row}>
      {visibles.map((clave) => (
        <Button
          key={clave}
          small={small}
          title={ACCIONES[clave].titulo}
          icon={ACCIONES[clave].icon}
          variant={ACCIONES[clave].variant}
          busy={enCurso === clave}
          disabled={!!enCurso && enCurso !== clave}
          onPress={() => ejecutar(clave)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
