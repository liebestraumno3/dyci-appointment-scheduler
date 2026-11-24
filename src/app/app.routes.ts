import { Routes } from '@angular/router';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Dashboard | Appointment Scheduler',
  },
  {
    path: 'appointments',
    component: AppointmentListComponent,
    title: 'Appointments | Appointment Scheduler',
  },
  {
    path: 'appointments/new',
    component: AppointmentFormComponent,
    title: 'New Appointment | Appointment Scheduler',
  },
  {
    path: 'appointments/:id/edit',
    component: AppointmentFormComponent,
    title: 'Edit Appointment | Appointment Scheduler',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
