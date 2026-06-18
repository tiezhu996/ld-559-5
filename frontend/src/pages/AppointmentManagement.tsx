import { Button, Card, DatePicker, Drawer, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { appointmentApi } from '../api/appointmentApi';
import { petApi } from '../api/petApi';
import { PetAvatar } from '../components/common/PetAvatar';
import { AppointmentStatus, VisitType, enumLabels, appointmentStatusLabels } from '../constants/enums';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../constants/enums';
import type { Appointment } from '../types/appointment';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'gold',
  [AppointmentStatus.CONFIRMED]: 'green',
  [AppointmentStatus.RESCHEDULED]: 'blue',
  [AppointmentStatus.CANCELLED]: 'red',
  [AppointmentStatus.COMPLETED]: 'gray',
};

export default function AppointmentManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>();
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment>();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [form] = Form.useForm();
  const [rescheduleForm] = Form.useForm();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', status],
    queryFn: () => appointmentApi.list({ status }),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petApi.list(),
    enabled: user?.role === UserRole.PET_OWNER,
  });

  const { data: vets = [] } = useQuery({
    queryKey: ['vets'],
    queryFn: () => appointmentApi.listVets(),
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => appointmentApi.listClinics(),
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => appointmentApi.create({
      ...values,
      appointmentDate: values.appointmentDate.toISOString(),
    }),
    onSuccess: () => {
      message.success('预约提交成功');
      setBookModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.confirm(id),
    onSuccess: () => {
      message.success('预约已确认');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.cancel(id),
    onSuccess: () => {
      message.success('预约已取消');
      setDetailOpen(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      appointmentApi.update(id, { appointmentDate: date }),
    onSuccess: () => {
      message.success('预约已改期');
      setRescheduleOpen(false);
      rescheduleForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const handleBook = () => {
    form.validateFields().then((values) => {
      createMutation.mutate(values);
    });
  };

  const handleReschedule = () => {
    rescheduleForm.validateFields().then((values) => {
      if (selected) {
        rescheduleMutation.mutate({
          id: selected.id,
          date: values.appointmentDate.toISOString(),
        });
      }
    });
  };

  const isVet = user?.role === UserRole.VET;
  const isOwner = user?.role === UserRole.PET_OWNER;

  const columns = [
    ...(isVet ? [{
      title: '宠物',
      dataIndex: 'pet',
      render: (_: any, record: Appointment) => (
        <Space>
          <PetAvatar name={record.pet?.name || '宠'} species={record.pet!.species} size={32} />
          {record.pet?.name}
        </Space>
      ),
    }] : []),
    ...(isOwner ? [{
      title: '兽医',
      dataIndex: ['vet', 'name'],
    }] : []),
    { title: '诊所', dataIndex: ['clinic', 'name'] },
    {
      title: '预约时间',
      dataIndex: 'appointmentDate',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (value: VisitType) => enumLabels[value],
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: AppointmentStatus) => (
        <Tag color={statusColors[value]}>{appointmentStatusLabels[value]}</Tag>
      ),
    },
    {
      title: '操作',
      render: (_: any, record: Appointment) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { setSelected(record); setDetailOpen(true); }}>
            详情
          </Button>
          {isVet && record.status === AppointmentStatus.PENDING && (
            <Button type="link" size="small" onClick={() => confirmMutation.mutate(record.id)}>
              确认
            </Button>
          )}
          {(isVet || isOwner) && record.status !== AppointmentStatus.CANCELLED && record.status !== AppointmentStatus.COMPLETED && (
            <Button type="link" size="small" onClick={() => { setSelected(record); setRescheduleOpen(true); }}>
              改期
            </Button>
          )}
          {(isVet || isOwner) && record.status !== AppointmentStatus.CANCELLED && record.status !== AppointmentStatus.COMPLETED && (
            <Button type="link" size="small" danger onClick={() => cancelMutation.mutate(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} className="page-block">
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>预约管理</Typography.Title>
          <Typography.Text type="secondary">
            {isVet ? '管理您的预约安排，确认或调整预约时间。' : '为您的宠物预约就诊，随时查看预约状态。'}
          </Typography.Text>
        </div>
        {isOwner && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBookModalOpen(true)}>
            发起预约
          </Button>
        )}
      </div>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="按状态筛选"
            style={{ width: 160 }}
            value={status}
            onChange={setStatus}
            options={Object.values(AppointmentStatus).map((value) => ({
              value,
              label: appointmentStatusLabels[value as AppointmentStatus],
            }))}
          />
        </Space>
        <Table
          rowKey="id"
          dataSource={appointments}
          columns={columns as any}
          onRow={(record) => ({ onClick: () => { setSelected(record as Appointment); setDetailOpen(true); } })}
        />
      </Card>

      <Modal
        title="发起预约"
        open={bookModalOpen}
        onOk={handleBook}
        onCancel={() => setBookModalOpen(false)}
        okText="提交预约"
        width={480}
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="petId"
            label="选择宠物"
            rules={[{ required: true, message: '请选择宠物' }]}
          >
            <Select placeholder="请选择宠物">
              {pets.map((pet: any) => (
                <Select.Option key={pet.id} value={pet.id}>{pet.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="clinicId"
            label="选择诊所"
            rules={[{ required: true, message: '请选择诊所' }]}
          >
            <Select placeholder="请选择诊所">
              {clinics.map((clinic: any) => (
                <Select.Option key={clinic.id} value={clinic.id}>
                  {clinic.name} - {clinic.address}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="vetId"
            label="选择兽医"
            rules={[{ required: true, message: '请选择兽医' }]}
          >
            <Select placeholder="请选择兽医">
              {vets.map((vet: any) => (
                <Select.Option key={vet.id} value={vet.id}>{vet.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="appointmentDate"
            label="预约时间"
            rules={[{ required: true, message: '请选择预约时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>
          <Form.Item
            name="type"
            label="就诊类型"
            rules={[{ required: true, message: '请选择就诊类型' }]}
          >
            <Select placeholder="请选择就诊类型">
              {Object.values(VisitType).map((value) => (
                <Select.Option key={value} value={value}>{enumLabels[value as VisitType]}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="症状描述">
            <TextArea rows={3} placeholder="请简要描述宠物的症状或就诊原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="预约详情"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={420}
        destroyOnClose
      >
        {selected && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">状态</Typography.Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={statusColors[selected.status]}>{appointmentStatusLabels[selected.status]}</Tag>
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">宠物</Typography.Text>
              <div style={{ marginTop: 4 }}>
                <Space>
                  <PetAvatar
                    name={selected.pet?.name || '宠'}
                    species={selected.pet!.species}
                    size={32}
                  />
                  {selected.pet?.name}
                </Space>
              </div>
            </div>
            {isOwner && (
              <div>
                <Typography.Text type="secondary">兽医</Typography.Text>
                <div style={{ marginTop: 4 }}>{selected.vet?.name}</div>
              </div>
            )}
            <div>
              <Typography.Text type="secondary">诊所</Typography.Text>
              <div style={{ marginTop: 4 }}>{selected.clinic?.name}</div>
              <Typography.Text type="secondary">{selected.clinic?.address}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">预约时间</Typography.Text>
              <div style={{ marginTop: 4 }}>
                {dayjs(selected.appointmentDate).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">就诊类型</Typography.Text>
              <div style={{ marginTop: 4 }}>{enumLabels[selected.type]}</div>
            </div>
            {selected.reason && (
              <div>
                <Typography.Text type="secondary">症状描述</Typography.Text>
                <div style={{ marginTop: 4 }}>{selected.reason}</div>
              </div>
            )}
            {selected.notes && (
              <div>
                <Typography.Text type="secondary">备注</Typography.Text>
                <div style={{ marginTop: 4 }}>{selected.notes}</div>
              </div>
            )}
            <Space wrap>
              {isVet && selected.status === AppointmentStatus.PENDING && (
                <Button type="primary" icon={<CheckOutlined />} onClick={() => confirmMutation.mutate(selected.id)}>
                  确认预约
                </Button>
              )}
              {selected.status !== AppointmentStatus.CANCELLED && selected.status !== AppointmentStatus.COMPLETED && (
                <Button icon={<EditOutlined />} onClick={() => { setRescheduleOpen(true); }}>
                  改期
                </Button>
              )}
              {selected.status !== AppointmentStatus.CANCELLED && selected.status !== AppointmentStatus.COMPLETED && (
                <Button danger icon={<CloseOutlined />} onClick={() => cancelMutation.mutate(selected.id)}>
                  取消预约
                </Button>
              )}
            </Space>
          </Space>
        )}
      </Drawer>

      <Modal
        title="预约改期"
        open={rescheduleOpen}
        onOk={handleReschedule}
        onCancel={() => setRescheduleOpen(false)}
        okText="确认改期"
        confirmLoading={rescheduleMutation.isPending}
        destroyOnClose
      >
        <Form form={rescheduleForm} layout="vertical">
          <Form.Item
            name="appointmentDate"
            label="新的预约时间"
            rules={[{ required: true, message: '请选择新的预约时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
