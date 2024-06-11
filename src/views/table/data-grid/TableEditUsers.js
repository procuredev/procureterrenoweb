import { useEffect, useState } from 'react'

import { useFirebase } from 'src/context/useFirebase'
// import useColumnResizer from 'src/@core/hooks/useColumnResizer'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import { esES } from '@mui/x-data-grid-pro'

import EditIcon from '@mui/icons-material/Edit'
import { Box, Card } from '@mui/material'
import IconButton from '@mui/material/IconButton'

import { EditUserDialog } from 'src/@core/components/dialog-editUser'

const TableEditUsers = ({ rows, role, roleData }) => {

  const [editingUser, setEditingUser] = useState({})
  const [dialogEditUserOpen, setDialogEditUserOpen] = useState(false)
  const [plantNames, setPlantNames] = useState([])
  const [allowableEmails, setAllowableEmails] = useState([])
  const [roles, setRoles] = useState([])
  const [userTypes, setUserTypes] = useState([])

  const { updateDocs, authUser, domainDictionary, getDomainData } = useFirebase()

  // Acá se define en una constante los nombres de las plantas como un array
  // Se agrega la planta "Sucursal Santiago" que tendrá características especiales dentro del sistema
  const getPlantNames = async () => {
    const plants = await getDomainData('plants')
    let plantsArray = Object.keys(plants)
    plantsArray.sort()
    plantsArray = [...plantsArray]
    setPlantNames(plantsArray)
  }

  const getAllowableEmailDomains = async () => {
    const domains = await getDomainData('allowableDomains')
    const array = Object.keys(domains)
    setAllowableEmails(array)
  }

  const getRolesDomains = async () => {
    const roles = await getDomainData('roles')
    const rolesArray = Object.keys(roles).map(key => ({ id: Number(key), ...roles[key] }))
    setRoles(rolesArray)
  }

  const getUserTypes = async () => {
    const types = await getDomainData('userType')
    const typesArray = Object.keys(types)
    setUserTypes(typesArray)
  }


  // Obtener los nombres de las plantas cuando el componente se monta
  useEffect(() => {
    getPlantNames()
    getAllowableEmailDomains()
    getRolesDomains()
    getUserTypes()
  }, [])

  const handleEditClick = (user) => {

    setEditingUser(user)
    setDialogEditUserOpen(true)

  }

  const handleCloseDialog = () => {
    setDialogEditUserOpen(false)
  }

  const theme = useTheme()
  const sm = useMediaQuery(theme.breakpoints.up('sm'))
  const md = useMediaQuery(theme.breakpoints.up('md'))
  const xl = useMediaQuery(theme.breakpoints.up('xl'))

  const plantsObject = {
    'Planta Concentradora Los Colorados': 'PCLC',
    'Planta Concentradora Laguna Seca | Línea 1': 'LSL1',
    'Planta Concentradora Laguna Seca | Línea 2': 'LSL2',
    'Chancado y Correas': 'CHCO',
    'Puerto Coloso': 'PCOL',
    'Instalaciones Cátodo': 'ICAT',
    'Instalaciones Mina': 'IMIN',
    'Instalaciones Lixiviación Sulfuros': 'SLIX',
    'Instalaciones Escondida Water Supply': 'IEWS',
    'Instalaciones Concentraducto': 'ICON',
    'Instalaciones Monturaqui': 'IMON',
    'Instalaciones Auxiliares': 'IAUX',
    'Subestaciones Eléctricas': 'SUBE',
    'Tranque y Relaves': 'TREL',
    'Campamento Villa San Lorenzo': 'CVSL',
    'Campamento Villa Cerro Alegre': 'CVCA'
  }

  const columns = [
    {
      field: 'name',
      headerName: 'Nombre',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 200,
      maxWidth: 250,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.name ? row.name : ''}</div>

      }
    },
    {
      field: 'rut',
      headerName: 'RUT',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 110,
      maxWidth: 150,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.rut ? row.rut : ''}</div>

      }
    },
    {
      field: 'email',
      headerName: 'e-mail',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 250,
      maxWidth: 350,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.email}</div>

      }
    },
    {
      field: 'phone',
      headerName: 'Teléfono',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 100,
      maxWidth: 250,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.phone ? row.phone : ''}</div>

      }
    },
    {
      field: 'company',
      headerName: 'Empresa',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 100,
      maxWidth: 150,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.company ? row.company : ''}</div>

      }
    },
    {
      field: 'role',
      headerName: 'Rol',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 150,
      maxWidth: 200,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{roles[row.role-1].name}</div>

      }
    },
    {
      field: 'subtype',
      headerName: 'Subtipo',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 50,
      maxWidth: 100,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.subtype || 'N/A'}</div>

      }
    },
    {
      field: 'shift',
      headerName: 'Turno',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 50,
      maxWidth: 70,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.shift && row.shift.length > 0 ? row.shift.join(', ') : ['N/A']}</div>

      }
    },
    {
      field: 'plant',
      headerName: 'Planta',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 150,
      maxWidth: 600,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)
        const plantDescriptions = row.plant && row.plant.length > 0 ? row.plant.map(plantKey => plantsObject[plantKey]) : ['N/A']

        return <div>{plantDescriptions.join(', ')}</div>

      }
    },
    {
      field: 'completedProfile',
      headerName: 'Perfil Completado',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 100,
      maxWidth: 150,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.completedProfile ? 'Si' : 'No'}</div>

      }
    },
    {
      field: 'enabled',
      headerName: 'Habilitado',
      //width: userLocalWidth ? userLocalWidth : 190,
      minWidth: 100,
      maxWidth: 150,
      renderCell: params => {
        const { row } = params
        // localStorage.setItem('userSolicitudesWidthColumn', params.colDef.computedWidth)

        return <div>{row.enabled ? 'Si' : 'No'}</div>

      }
    },
    {
      field: 'edit',
      headerName: 'Editar Usuario',
      minWidth: 150,
      maxWidth: 150,
      renderCell: params => {
        const { row } = params

        return (
          <IconButton onClick={() => handleEditClick(row)}>
            <EditIcon />
          </IconButton>
        )

      }
    }
  ]

  return (
    <Card>
      <Box sx={{ height: 500 }}>
        <DataGridPremium
          initialState={{
            sorting: {
              sortModel: [{ field: 'company', sort: 'desc' }]
            }
          }}
          hideFooterSelectedRowCount
          rows={rows}
          columns={columns}
          // columnVisibilityModel={columnVisibilityModel}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
        { dialogEditUserOpen && (
          <EditUserDialog
            open={dialogEditUserOpen}
            handleClose={handleCloseDialog}
            doc={editingUser}
            plantNames={plantNames}
            allowableDomains={allowableEmails}
            userRoles={roles}
            userTypes={userTypes}
          />
        )}
      </Box>
    </Card>
  )
}

export default TableEditUsers
