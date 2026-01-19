'use client';

import React, { useState, useEffect } from 'react';
import { User, UserPlus, Shield, Eye, Edit, Trash2, AlertCircle, CheckCircle, Mail, Calendar } from 'lucide-react';
import { Usuario, UsuarioRegistro, Rol } from '@/types';

interface GestionUsuariosProps {
  usuarioActual: {
    id: string;
    email: string;
    nombre: string;
    rol: Rol;
  };
}

const GestionUsuarios: React.FC<GestionUsuariosProps> = ({ usuarioActual }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormulario, setShowFormulario] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const [nuevoUsuario, setNuevoUsuario] = useState<UsuarioRegistro>({
    email: '',
    password: '',
    nombre: '',
    rol: 'Viewer',
  });

  const [datosEdicion, setDatosEdicion] = useState({
    nombre: '',
    email: '',
    rol: 'Viewer' as Rol,
    estado: 'Activo' as 'Activo' | 'Inactivo',
    password: '',
    cambiarPassword: false,
  });

  useEffect(() => {
    if (usuarioActual.rol === 'SuperAdmin') {
      cargarUsuarios();
    }
  }, [usuarioActual.rol]);

  const cargarUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        console.error('Error al cargar usuarios:', response.statusText);
        // Datos de fallback
        setUsuarios([
          {
            id: '1',
            email: usuarioActual.email,
            nombre: usuarioActual.nombre,
            rol: usuarioActual.rol,
            estado: 'Activo',
            fechaCreacion: new Date().toISOString(),
          }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      // Datos de fallback en caso de error
      setUsuarios([
        {
          id: '1',
          email: usuarioActual.email,
          nombre: usuarioActual.nombre,
          rol: usuarioActual.rol,
          estado: 'Activo',
          fechaCreacion: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoUsuario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoUsuario),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Usuario creado exitosamente' });
        setNuevoUsuario({ email: '', password: '', nombre: '', rol: 'Viewer' });
        setShowFormulario(false);
        cargarUsuarios();
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al crear usuario' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEdicion = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setDatosEdicion({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      password: '',
      cambiarPassword: false,
    });
    setShowEditModal(true);
    setMensaje(null);
  };

  const cerrarModalEdicion = () => {
    setShowEditModal(false);
    setUsuarioEditando(null);
    setDatosEdicion({
      nombre: '',
      email: '',
      rol: 'Viewer',
      estado: 'Activo',
      password: '',
      cambiarPassword: false,
    });
  };

  const handleEdicionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setDatosEdicion(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setDatosEdicion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setLoading(true);
    setMensaje(null);

    try {
      const datosActualizar: any = {
        nombre: datosEdicion.nombre,
        email: datosEdicion.email,
        rol: datosEdicion.rol,
        estado: datosEdicion.estado,
      };

      // Solo incluir password si se marcó para cambiar
      if (datosEdicion.cambiarPassword && datosEdicion.password) {
        datosActualizar.password = datosEdicion.password;
      }

      const response = await fetch(`/api/usuarios/${usuarioEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datosActualizar),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Usuario actualizado exitosamente' });
        cerrarModalEdicion();
        cargarUsuarios();
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al actualizar usuario' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (rol: Rol) => {
    const colors = {
      SuperAdmin: 'bg-purple-100 text-purple-800 border-purple-200',
      Admin: 'bg-red-100 text-red-800 border-red-200',
      Editor: 'bg-blue-100 text-blue-800 border-blue-200',
      Viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[rol]}`}>
        <Shield className="w-3 h-3 mr-1" />
        {rol}
      </span>
    );
  };

  const getEstadoBadge = (estado: string) => {
    return estado === 'Activo' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Inactivo
      </span>
    );
  };

  if (usuarioActual.rol !== 'SuperAdmin') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
        <p className="text-gray-600">Solo los SuperAdministradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <User className="w-6 h-6 mr-3 text-blue-600" />
            Gestión de Usuarios
          </h2>
          <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowFormulario(!showFormulario)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Crear Usuario
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' 
            ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            : <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          }
          <span className={mensaje.tipo === 'success' ? 'text-green-800' : 'text-red-800'}>
            {mensaje.texto}
          </span>
        </div>
      )}

      {/* Formulario de Crear Usuario */}
      {showFormulario && (
        <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoUsuario.nombre}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={nuevoUsuario.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={nuevoUsuario.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  name="rol"
                  value={nuevoUsuario.rol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Editor">Editor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowFormulario(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Usuarios */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Creado</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{usuario.nombre}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {usuario.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {getRoleBadge(usuario.rol)}
                </td>
                <td className="py-4 px-4">
                  {getEstadoBadge(usuario.estado)}
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-600 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(usuario.fechaCreacion).toLocaleDateString('es-ES')}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {usuario.id !== usuarioActual.id && (
                      <>
                        <button
                          onClick={() => abrirModalEdicion(usuario)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {showEditModal && usuarioEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-blue-600" />
                  Editar Usuario
                </h3>
                <button
                  onClick={cerrarModalEdicion}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitEdicion} className="space-y-5">
                {/* Información del Usuario */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{usuarioEditando.nombre}</div>
                      <div className="text-sm text-gray-600">{usuarioEditando.email}</div>
                    </div>
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={datosEdicion.nombre}
                    onChange={handleEdicionChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={datosEdicion.email}
                    onChange={handleEdicionChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Rol y Estado en la misma fila */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol *
                    </label>
                    <select
                      name="rol"
                      value={datosEdicion.rol}
                      onChange={handleEdicionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Editor">Editor</option>
                      <option value="Admin">Admin</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      name="estado"
                      value={datosEdicion.estado}
                      onChange={handleEdicionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* Cambiar Contraseña */}
                <div className="border-t pt-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="cambiarPassword"
                      name="cambiarPassword"
                      checked={datosEdicion.cambiarPassword}
                      onChange={handleEdicionChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="cambiarPassword" className="ml-2 text-sm font-medium text-gray-700">
                      Cambiar contraseña
                    </label>
                  </div>

                  {datosEdicion.cambiarPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={datosEdicion.password}
                        onChange={handleEdicionChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        minLength={6}
                        required={datosEdicion.cambiarPassword}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dejar en blanco para mantener la contraseña actual
                      </p>
                    </div>
                  )}
                </div>

                {/* Mensaje de Error en Modal */}
                {mensaje && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    mensaje.tipo === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {mensaje.tipo === 'success'
                      ? <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      : <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                    }
                    <span className={mensaje.tipo === 'success' ? 'text-green-800' : 'text-red-800'}>
                      {mensaje.texto}
                    </span>
                  </div>
                )}

                {/* Botones */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={cerrarModalEdicion}
                    disabled={loading}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;