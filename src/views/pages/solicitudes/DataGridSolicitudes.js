// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'

// ** Demo Components Imports
import TableBasic from 'src/views/table/data-grid/TableBasic'
import TableFilter from 'src/views/table/data-grid/TableFilter'
import TableColumns from 'src/views/table/data-grid/TableColumns'
import TableEditable from 'src/views/table/data-grid/TableEditable'
import TableBasicSort from 'src/views/table/data-grid/TableBasicSort'
import TableSelection from 'src/views/table/data-grid/TableSelection'
import TableServerSide from 'src/views/table/data-grid/TableServerSide'


const DataGrid = () => {
  const [value, setValue] = useState('1');
  const [roleData, setRoleData] = useState({name:'admin'});

  const { useSnapshot, authUser, getRoleData } = useFirebase()
  const data = useSnapshot()
  console.log(data)

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getRoleData(authUser.role.toString())
        setRoleData(role)
      }
    }

    role();
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabContent = authUser ? [
    {
      data: data,
      label: 'Todas las solicitudes'
    },
    {
      data: data.filter(doc => doc.state === authUser.role-1),
      label: 'Por aprobar'
    },
    {
      data: data.filter(doc => doc.state >= 7 && doc.state < 10),
      label: 'Aprobadas'
    },
    {
      data: data.filter(doc => doc.state === 10),
      label: 'Rechazadas'
    },
  ] : []



  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <PageHeader
        title={
          <Typography variant='h5'>
            <Link href='https://mui.com/x/react-data-grid/' target='_blank'>
              Solicitudes
            </Link>
          </Typography>
        }
      />
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            {tabContent.map((element, index) => (
              <Tab label={element.label} value={`${index + 1}`} key={index} />
            ))}
          </TabList>
        </Box>
        {tabContent.map((element, index) => (
          <Grid item xs={12} key={index}>
            <TabPanel key={index} value={`${index + 1}`}><TableBasic rows={element.data} roleData={roleData} role={authUser.role}/>
            </TabPanel>
          </Grid>
        ))}
      </TabContext>
    </Box>
  )
}

export default DataGrid

